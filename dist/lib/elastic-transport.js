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
function initializeBulkHandler(opts, client, splitter) {
    var _a, _b, _c, _d, _e, _f, _g;
    const esVersion = Number((_b = (_a = opts.esVersion) !== null && _a !== void 0 ? _a : opts['es-version']) !== null && _b !== void 0 ? _b : 7);
    const index = (_c = opts.index) !== null && _c !== void 0 ? _c : 'pino';
    const buildIndexName = typeof index === 'function' ? index : null;
    const opType = esVersion >= 7 ? undefined : undefined;
    // CRITICAL FIX (issue #140): When bulk helper destroys stream after retries exhausted,
    // we must BOTH resurrect the pool AND reinitialize the bulk handler so logging continues.
    // connectionPool.resurrect exists at runtime (elastic-transport) but may not be in types
    const pool = client.connectionPool;
    const splitterWithDestroy = splitter;
    splitterWithDestroy.destroy = function () {
        if (typeof pool.resurrect === 'function') {
            pool.resurrect({ name: 'elasticsearch-js' });
        }
        // Reinitialize bulk handler - without this, logging stops permanently until restart
        initializeBulkHandler(opts, client, splitter);
    };
    const indexName = (time = new Date().toISOString()) => buildIndexName ? buildIndexName(time) : getIndexName(index, time);
    const bulkInsert = client.helpers.bulk({
        datasource: splitter,
        flushBytes: (_e = (_d = opts.flushBytes) !== null && _d !== void 0 ? _d : opts['flush-bytes']) !== null && _e !== void 0 ? _e : 1000,
        flushInterval: (_g = (_f = opts.flushInterval) !== null && _f !== void 0 ? _f : opts['flush-interval']) !== null && _g !== void 0 ? _g : 3000,
        refreshOnCompletion: indexName(),
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
    bulkInsert.then((stats) => splitter.emit('insert', stats), (err) => splitter.emit('error', err));
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
    client.diagnostic.on('resurrect', () => {
        initializeBulkHandler(opts, client, splitter);
    });
    initializeBulkHandler(opts, client, splitter);
    return splitter;
};
exports.createElasticTransport = createElasticTransport;
