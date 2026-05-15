"use strict";
/**
 * Elasticsearch transport for Pino with connection lifecycle resilience.
 *
 * Based on pino-elasticsearch with a fix for GitHub issue #140:
 * When maxRetries are exceeded and Elasticsearch nodes are DEAD, the bulk helper
 * destroys the splitter stream, causing logs to stop permanently until restart.
 *
 * This implementation overrides splitter.destroy to BOTH resurrect the connection
 * pool AND reinitialize the bulk handler, so logging continues after ES recovers.
 *
 * @see https://github.com/pinojs/pino-elasticsearch/issues/140
 * @see https://github.com/pinojs/pino-elasticsearch/issues/72
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElasticTransport = void 0;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const split = require('split2');
const elasticsearch_1 = require("@elastic/elasticsearch");
function setDateTimeString(value) {
    if (value !== null && typeof value === 'object' && 'time' in value) {
        const t = value.time;
        if ((typeof t === 'string' && t.length > 0) ||
            (typeof t === 'number' && t >= 0)) {
            return new Date(t).toISOString();
        }
    }
    return new Date().toISOString();
}
function getIndexName(index, time) {
    if (typeof index === 'function') {
        return index(time);
    }
    return index.replace('%{DATE}', time.substring(0, 10));
}
function initializeBulkHandler(opts, client, splitter, onFatalError) {
    var _a, _b, _c, _d, _e, _f, _g;
    const esVersion = Number((_b = (_a = opts.esVersion) !== null && _a !== void 0 ? _a : opts['es-version']) !== null && _b !== void 0 ? _b : 7);
    const index = (_c = opts.index) !== null && _c !== void 0 ? _c : 'pino';
    const buildIndexName = typeof index === 'function' ? index : null;
    const opType = esVersion >= 7 ? undefined : undefined;
    const indexName = (time = new Date().toISOString()) => buildIndexName ? buildIndexName(time) : getIndexName(index, time);
    const bulkInsert = client.helpers.bulk({
        datasource: splitter,
        flushBytes: (_e = (_d = opts.flushBytes) !== null && _d !== void 0 ? _d : opts['flush-bytes']) !== null && _e !== void 0 ? _e : 1000,
        flushInterval: (_g = (_f = opts.flushInterval) !== null && _f !== void 0 ? _f : opts['flush-interval']) !== null && _g !== void 0 ? _g : 3000,
        refreshOnCompletion: false,
        onDocument(doc) {
            var _a, _b;
            const d = doc;
            const date = (_b = (_a = d.time) !== null && _a !== void 0 ? _a : d['@timestamp']) !== null && _b !== void 0 ? _b : new Date().toISOString();
            if (opType === 'create') {
                d['@timestamp'] = date;
            }
            return {
                index: {
                    _index: indexName(date),
                    op_type: opType,
                },
            };
        },
        onDrop(doc) {
            const error = new Error('Dropped document');
            error.document = doc;
            splitter.emit('insertError', error);
        },
    });
    bulkInsert.then((stats) => splitter.emit('insert', stats), (err) => {
        splitter.emit('error', err);
        onFatalError(err);
    });
}
const createElasticTransport = (opts = {}) => {
    const splitter = split(function (line) {
        let value;
        try {
            value = JSON.parse(line);
        }
        catch (error) {
            this.emit('unknown', line, error);
            return;
        }
        if (typeof value === 'boolean') {
            this.emit('unknown', line, 'Boolean value ignored');
            return;
        }
        if (value === null) {
            this.emit('unknown', line, 'Null value ignored');
            return;
        }
        if (typeof value !== 'object') {
            value = { data: value, time: setDateTimeString(value) };
        }
        else {
            const obj = value;
            if (obj['@timestamp'] === undefined) {
                ;
                obj.time = setDateTimeString(obj);
            }
        }
        return value;
    }, { autoDestroy: true });
    const clientOpts = {
        node: opts.node,
        auth: opts.auth,
        cloud: opts.cloud,
        tls: { rejectUnauthorized: opts.rejectUnauthorized, ...opts.tls },
        maxRetries: opts.maxRetries,
        requestTimeout: opts.requestTimeout,
        sniffOnConnectionFault: opts.sniffOnConnectionFault,
    };
    if (opts.caFingerprint) {
        clientOpts.caFingerprint = opts.caFingerprint;
    }
    if (opts.Connection) {
        clientOpts.Connection = opts.Connection;
    }
    if (opts.ConnectionPool) {
        clientOpts.ConnectionPool = opts.ConnectionPool;
    }
    const client = new elasticsearch_1.Client(clientOpts);
    // CRITICAL FIX (pino-elasticsearch issues #140/#72): after retries are
    // exhausted the bulk helper can stop consuming the stream while the process
    // stays alive. Keep exactly one helper active and replace it after fatal
    // helper failures instead of waiting for a server restart.
    let isBulkHandlerActive = false;
    let isRestartScheduled = false;
    let isTransportClosed = false;
    const pool = client.connectionPool;
    const splitterWithDestroy = splitter;
    const originalDestroy = splitterWithDestroy.destroy.bind(splitterWithDestroy);
    const startBulkHandler = () => {
        if (isTransportClosed || isBulkHandlerActive) {
            return;
        }
        isBulkHandlerActive = true;
        initializeBulkHandler(opts, client, splitter, () => {
            isBulkHandlerActive = false;
            scheduleBulkHandlerRestart();
        });
    };
    const scheduleBulkHandlerRestart = () => {
        var _a, _b, _c;
        if (isTransportClosed || isRestartScheduled) {
            return;
        }
        isRestartScheduled = true;
        if (typeof pool.resurrect === 'function') {
            pool.resurrect({ name: 'elasticsearch-js' });
        }
        const retryDelayMs = Math.min(Number((_b = (_a = opts.flushInterval) !== null && _a !== void 0 ? _a : opts['flush-interval']) !== null && _b !== void 0 ? _b : 3000), 5000);
        const timer = setTimeout(() => {
            isRestartScheduled = false;
            startBulkHandler();
        }, retryDelayMs);
        (_c = timer.unref) === null || _c === void 0 ? void 0 : _c.call(timer);
    };
    splitterWithDestroy.destroy = function (err) {
        if (err && !isTransportClosed) {
            scheduleBulkHandlerRestart();
            return;
        }
        isTransportClosed = true;
        originalDestroy(err);
    };
    client.diagnostic.on('resurrect', () => {
        if (!isBulkHandlerActive) {
            scheduleBulkHandlerRestart();
        }
    });
    startBulkHandler();
    return splitter;
};
exports.createElasticTransport = createElasticTransport;
