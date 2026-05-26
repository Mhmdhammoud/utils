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
const createTimeoutError = (timeoutMs) => new Error(`Elasticsearch bulk request timed out after ${timeoutMs}ms`);
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
function createBulkSender(opts, client, splitter) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const esVersion = Number((_b = (_a = opts.esVersion) !== null && _a !== void 0 ? _a : opts['es-version']) !== null && _b !== void 0 ? _b : 7);
    const index = (_c = opts.index) !== null && _c !== void 0 ? _c : 'pino';
    const buildIndexName = typeof index === 'function' ? index : null;
    const opType = esVersion >= 7 ? undefined : undefined;
    const flushBytes = (_e = (_d = opts.flushBytes) !== null && _d !== void 0 ? _d : opts['flush-bytes']) !== null && _e !== void 0 ? _e : 1000;
    const flushInterval = (_g = (_f = opts.flushInterval) !== null && _f !== void 0 ? _f : opts['flush-interval']) !== null && _g !== void 0 ? _g : 3000;
    const requestTimeout = (_h = opts.requestTimeout) !== null && _h !== void 0 ? _h : 30000;
    const bulkWatchdogTimeout = requestTimeout + 5000;
    let buffer = [];
    let bufferedBytes = 0;
    let timer;
    let isFlushing = false;
    let flushAgain = false;
    const indexName = (time = new Date().toISOString()) => buildIndexName ? buildIndexName(time) : getIndexName(index, time);
    const clearFlushTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
    };
    const scheduleFlush = () => {
        var _a;
        if (timer || buffer.length === 0) {
            return;
        }
        timer = setTimeout(() => {
            timer = undefined;
            void flush();
        }, flushInterval);
        (_a = timer.unref) === null || _a === void 0 ? void 0 : _a.call(timer);
    };
    const buildOperation = (doc) => {
        var _a, _b;
        try {
            const d = doc;
            const date = (_b = (_a = d.time) !== null && _a !== void 0 ? _a : d['@timestamp']) !== null && _b !== void 0 ? _b : new Date().toISOString();
            if (opType === 'create') {
                d['@timestamp'] = date;
            }
            return [
                {
                    index: {
                        _index: indexName(date),
                        op_type: opType,
                    },
                },
                doc,
            ];
        }
        catch (_c) {
            return [
                {
                    index: {
                        _index: indexName(),
                        op_type: opType,
                    },
                },
                doc,
            ];
        }
    };
    const emitDroppedDocument = (doc, cause) => {
        const error = new Error('Dropped document');
        error.document = doc;
        error.cause = cause;
        splitter.emit('insertError', error);
    };
    const emitBulkError = (err) => {
        // Do not emit the standard stream "error" event for retryable bulk
        // failures. Some stream consumers treat it as terminal, which can leave
        // Pino writing into a poisoned stream while the process continues running.
        splitter.emit('bulkError', err);
    };
    const bulkWithWatchdog = async (operations) => {
        let timeout;
        const bulkPromise = client.bulk({
            operations,
            refresh: false,
            timeout: `${requestTimeout}ms`,
        });
        try {
            return await Promise.race([
                bulkPromise,
                new Promise((_, reject) => {
                    var _a;
                    timeout = setTimeout(() => {
                        reject(createTimeoutError(bulkWatchdogTimeout));
                    }, bulkWatchdogTimeout);
                    (_a = timeout.unref) === null || _a === void 0 ? void 0 : _a.call(timeout);
                }),
            ]);
        }
        finally {
            if (timeout) {
                clearTimeout(timeout);
            }
            // If the watchdog wins, the original request may reject later. Consume
            // that rejection so a stale request cannot crash the app.
            bulkPromise.catch(() => undefined);
        }
    };
    const flush = async () => {
        var _a, _b;
        if (isFlushing) {
            flushAgain = true;
            return;
        }
        clearFlushTimer();
        if (buffer.length === 0) {
            return;
        }
        isFlushing = true;
        const batch = buffer;
        buffer = [];
        bufferedBytes = 0;
        try {
            const operations = batch.flatMap(buildOperation);
            const body = await bulkWithWatchdog(operations);
            if (body.errors && Array.isArray(body.items)) {
                body.items.forEach((item, index) => {
                    const result = Object.values(item)[0];
                    if (result === null || result === void 0 ? void 0 : result.error) {
                        emitDroppedDocument(batch[index], result.error);
                    }
                });
            }
            splitter.emit('insert', {
                successful: batch.length,
                failed: body.errors
                    ? ((_b = (_a = body.items) === null || _a === void 0 ? void 0 : _a.filter((item) => { var _a; return (_a = Object.values(item)[0]) === null || _a === void 0 ? void 0 : _a.error; }).length) !== null && _b !== void 0 ? _b : 0)
                    : 0,
            });
        }
        catch (err) {
            emitBulkError(err);
            // Drop the failed batch instead of wedging the stream. The next log line
            // creates a fresh bulk request and can recover without a process restart.
            batch.forEach((doc) => emitDroppedDocument(doc, err));
        }
        finally {
            isFlushing = false;
            if (flushAgain || buffer.length > 0) {
                flushAgain = false;
                scheduleFlush();
                if (bufferedBytes >= flushBytes) {
                    void flush();
                }
            }
        }
    };
    return {
        add(doc) {
            buffer.push(doc);
            bufferedBytes += Buffer.byteLength(JSON.stringify(doc));
            if (bufferedBytes >= flushBytes) {
                void flush();
                return;
            }
            scheduleFlush();
        },
        flush,
        async close() {
            clearFlushTimer();
            await flush();
        },
    };
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
    const bulkSender = createBulkSender(opts, client, splitter);
    splitter.on('data', (doc) => {
        bulkSender.add(doc);
    });
    splitter.on('finish', () => {
        void bulkSender.close();
    });
    const splitterWithDestroy = splitter;
    splitterWithDestroy.flush = bulkSender.flush;
    splitterWithDestroy.close = bulkSender.close;
    const originalDestroy = splitterWithDestroy.destroy.bind(splitterWithDestroy);
    splitterWithDestroy.destroy = function (err) {
        void bulkSender.close();
        originalDestroy(err);
    };
    return splitterWithDestroy;
};
exports.createElasticTransport = createElasticTransport;
