"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLogLevel = isValidLogLevel;
const pino_1 = require("pino");
const dotenv = __importStar(require("dotenv"));
const os_1 = require("os");
const elastic_transport_1 = require("./elastic-transport");
const trace_store_1 = require("./trace-store");
dotenv.config();
/** Convert camelCase to snake_case for Kibana/ECS-friendly field names */
const toSnakeCase = (str) => str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
/**
 * Elasticsearch reserves metadata fields (e.g. `_id`) and rejects documents
 * containing them in payload body. Remap them to safe application fields.
 */
const RESERVED_ES_FIELD_ALIASES = {
    _id: 'mongo_id',
    _index: 'es_index',
    _type: 'es_type',
    _score: 'es_score',
    _source: 'es_source',
    _routing: 'es_routing',
    _seq_no: 'es_seq_no',
    _primary_term: 'es_primary_term',
    _version: 'es_version',
};
/** Convert arbitrary field names into ES-safe flattened keys */
const toSafeElasticFieldName = (key) => {
    const normalized = toSnakeCase(key);
    const mapped = RESERVED_ES_FIELD_ALIASES[normalized];
    if (mapped) {
        return mapped;
    }
    // Any leading underscore can conflict with ES internals, remap defensively.
    return normalized.startsWith('_') ? `meta${normalized}` : normalized;
};
const isObjectIdLike = (v) => v !== null &&
    typeof v === 'object' &&
    'toHexString' in v &&
    typeof v.toHexString === 'function';
/** Check if value is a plain object (not Error, Date, Array, null) */
const isPlainObject = (v) => v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    !(v instanceof Error) &&
    !(v instanceof Date);
/**
 * Recursively sanitize log values for Elasticsearch safety.
 * - Remaps reserved key names (e.g. `_id` -> `mongo_id`)
 * - Converts Error to a stable serializable shape
 * - Converts ObjectId-like objects to hex strings
 * - Prevents circular structure failures
 */
const sanitizeForElastic = (value, seen = new WeakSet()) => {
    if (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (value instanceof Error) {
        return { message: value.message, type: value.constructor.name };
    }
    if (isObjectIdLike(value)) {
        return value.toHexString();
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeForElastic(item, seen));
    }
    if (isPlainObject(value)) {
        if (seen.has(value)) {
            return '[Circular]';
        }
        seen.add(value);
        const sanitizedObject = {};
        for (const [k, v] of Object.entries(value)) {
            sanitizedObject[toSafeElasticFieldName(k)] = sanitizeForElastic(v, seen);
        }
        return sanitizedObject;
    }
    // Fallback for class instances and non-plain objects.
    return String(value);
};
/**
 * Captures the call site from the stack when log event is missing.
 * Returns file:line (e.g. product.service.ts:2266) for Kibana/Elasticsearch filtering.
 */
const getCallSiteForMissingLog = () => {
    var _a;
    try {
        const stack = (_a = new Error().stack) !== null && _a !== void 0 ? _a : '';
        const lines = stack.split('\n');
        // First frame outside Logger / node_modules / meritt-utils
        const appFrame = lines.find((line) => !line.includes('node_modules') &&
            !line.includes('meritt-utils') &&
            !line.includes('Logger.'));
        if (!appFrame)
            return undefined;
        // Extract file:line e.g. "product.service.ts:2266"
        const match = appFrame.match(/([^/\\]+\.(?:ts|js|tsx|jsx)):(\d+)/);
        if (match) {
            return `${match[1]}:${match[2]}`;
        }
        return appFrame.trim().slice(0, 100);
    }
    catch (_b) {
        return undefined;
    }
};
/**
 * Pino logger backend - singleton
 */
let pinoLogger;
/**
 * Elasticsearch transport instance - kept for cleanup
 */
let esTransport = null;
/**
 * Flag to track if shutdown handlers are registered
 */
let shutdownHandlersRegistered = false;
/**
 * Validates required Elasticsearch environment variables.
 * @throws Error if required environment variables are missing.
 */
function validateElasticsearchEnv() {
    const required = [
        'ELASTICSEARCH_NODE',
        'ELASTICSEARCH_USERNAME',
        'ELASTICSEARCH_PASSWORD',
        'SERVER_NICKNAME',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required Elasticsearch environment variables: ${missing.join(', ')}`);
    }
}
/**
 * Safely parses an integer from an environment variable.
 * @param envValue - The environment variable value to parse.
 * @param defaultValue - The default value to use if parsing fails.
 * @param varName - The name of the environment variable (for error messages).
 * @returns The parsed integer or the default value.
 * @throws Error if the value is not a valid number.
 */
function parseIntEnv(envValue, defaultValue, varName) {
    if (!envValue) {
        return defaultValue;
    }
    const parsed = parseInt(envValue, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid value for ${varName}: "${envValue}" is not a valid number. Using default: ${defaultValue}`);
    }
    if (parsed < 0) {
        throw new Error(`Invalid value for ${varName}: "${envValue}" must be a positive number. Using default: ${defaultValue}`);
    }
    return parsed;
}
/**
 * Registers shutdown handlers to flush logs before process exits.
 */
function registerShutdownHandlers() {
    if (shutdownHandlersRegistered) {
        return;
    }
    let isShuttingDown = false;
    const flushAndExit = async (signal, exitCode = 0) => {
        // Prevent multiple shutdown attempts
        if (isShuttingDown) {
            return;
        }
        isShuttingDown = true;
        if (esTransport) {
            try {
                // Flush any pending logs
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.error(`[Logger] Flush timeout after 5s on ${signal}`);
                        resolve();
                    }, 5000); // 5 second timeout
                    // Register listener BEFORE calling end() to avoid race condition
                    esTransport === null || esTransport === void 0 ? void 0 : esTransport.once('finish', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                    // Now trigger the flush
                    esTransport === null || esTransport === void 0 ? void 0 : esTransport.end();
                });
            }
            catch (error) {
                console.error(`[Logger] Error flushing logs on ${signal}:`, error);
            }
        }
        process.exit(exitCode);
    };
    process.on('SIGTERM', () => {
        flushAndExit('SIGTERM', 0).catch((err) => {
            console.error('[Logger] Flush and exit failed:', err);
            process.exit(1);
        });
    });
    process.on('SIGINT', () => {
        flushAndExit('SIGINT', 130).catch((err) => {
            console.error('[Logger] Flush and exit failed:', err);
            process.exit(1);
        });
    });
    process.on('beforeExit', () => {
        if (esTransport && !isShuttingDown) {
            esTransport.end();
        }
    });
    shutdownHandlersRegistered = true;
}
/**
 * Creates a Pino logger instance with specified Elasticsearch configuration.
 * @param elasticConfig - Optional Elasticsearch configuration.
 * @returns The Pino logger instance.
 * @throws Error if LOG_LEVEL is invalid or required environment variables are missing.
 */
function getLogger(elasticConfig) {
    if (!pinoLogger) {
        // Validate log level - will throw if invalid
        const logLevel = process.env.LOG_LEVEL || 'info';
        isValidLogLevel(logLevel);
        const transports = [];
        if (process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'test') {
            // Validate Elasticsearch environment variables
            validateElasticsearchEnv();
            // Parse flush settings from environment with validation
            const flushIntervalMs = parseIntEnv(process.env.ES_FLUSH_INTERVAL_MS, 2000, // Default: 2 seconds
            'ES_FLUSH_INTERVAL_MS');
            const flushBytes = parseIntEnv(process.env.ES_FLUSH_BYTES, 100 * 1024, // Default: 100KB
            'ES_FLUSH_BYTES');
            const maxRetries = parseIntEnv(process.env.ES_MAX_RETRIES, 3, // Default: 3 retries
            'ES_MAX_RETRIES');
            const requestTimeout = parseIntEnv(process.env.ES_REQUEST_TIMEOUT_MS, 30000, // Default: 30 seconds
            'ES_REQUEST_TIMEOUT_MS');
            // Safe to access after validation
            const esConfig = {
                index: process.env.SERVER_NICKNAME,
                node: process.env.ELASTICSEARCH_NODE,
                auth: {
                    username: process.env.ELASTICSEARCH_USERNAME,
                    password: process.env.ELASTICSEARCH_PASSWORD,
                },
                // Configurable flush settings
                flushInterval: flushIntervalMs,
                'flush-bytes': flushBytes,
                // Retry configuration for connection resilience
                maxRetries: maxRetries,
                requestTimeout: requestTimeout,
                // Automatically reconnect on connection faults
                sniffOnConnectionFault: true,
            };
            if (elasticConfig) {
                Object.assign(esConfig, elasticConfig);
            }
            // Create transport with connection lifecycle fix (pino-elasticsearch #140)
            esTransport = (0, elastic_transport_1.createElasticTransport)(esConfig);
            // Handle Elasticsearch connection errors
            esTransport.on('error', (err) => {
                console.error('[Logger] Elasticsearch transport error:', err.message);
                console.error('[Logger] Logs may not be reaching Kibana. Check Elasticsearch connection.');
            });
            // Handle insert errors (document indexing failures)
            esTransport.on('insertError', (err) => {
                console.error('[Logger] Elasticsearch insert error:', err.message);
                console.error('[Logger] Some logs failed to index to Elasticsearch.');
                if (err.document) {
                    const docStr = JSON.stringify(err.document);
                    const preview = docStr.length > 500
                        ? `${docStr.substring(0, 500)}... (truncated)`
                        : docStr;
                    console.error('[Logger] Dropped document preview:', preview);
                }
            });
            // Log successful connection (for debugging)
            esTransport.on('insert', () => {
                // Uncomment for debugging: console.log(`[Logger] Successfully inserted log entries`)
            });
            // Register shutdown handlers to flush logs on process exit
            registerShutdownHandlers();
            transports.push(esTransport);
        }
        else {
            transports.push(pino_1.pino.destination({
                minLength: 1024,
                sync: true,
            }));
        }
        pinoLogger = (0, pino_1.pino)({
            level: logLevel,
            timestamp: pino_1.stdTimeFunctions.isoTime.bind(pino_1.stdTimeFunctions),
        }, ...transports);
    }
    return pinoLogger;
}
/**
 * Checks if a given log level is valid.
 * @param level - The log level to check.
 * @returns Whether the log level is valid.
 */
function isValidLogLevel(level) {
    if (!['error', 'warn', 'info', 'debug', 'trace'].includes(level)) {
        throw new Error(`Invalid log level "${level}": only error, warn, info, debug, trace are valid.`);
    }
    return true;
}
/**
 * Logger Wrapper.
 * Wraps a Pino logger instance and provides logging methods.
 */
class Logger {
    constructor(name, elasticConfig) {
        this._name = name;
        this._logger = getLogger(elasticConfig);
    }
    /**
     * Build ECS-aligned and structured log payload.
     * - ECS: log.level, log.logger, event.code, service.name, service.environment, message
     * - Structured: Single plain object flattened as top-level snake_case fields (Kibana filterable)
     * - Trace: trace.id when running inside runWithTrace
     */
    buildPayload(logLevel, logEvent, args) {
        var _a, _b;
        const isLocal = process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test';
        // Defensive: missing Logs constant (undefined) crashes on logEvent.code
        const useFallback = !logEvent || typeof logEvent !== 'object' || !('code' in logEvent);
        const event = useFallback
            ? { code: 'UNKNOWN', msg: 'Missing or invalid log event constant' }
            : logEvent;
        // ECS-aligned fields for Kibana (flat names to avoid mapping conflicts with existing indices)
        const ecs = {
            log_level: logLevel,
            log_logger: this._name,
            event_code: event.code,
            message: event.msg,
            service_name: (_a = process.env.SERVER_NICKNAME) !== null && _a !== void 0 ? _a : 'unknown',
            service_environment: (_b = process.env.NODE_ENV) !== null && _b !== void 0 ? _b : 'development',
            host_name: (0, os_1.hostname)(),
        };
        // Trace context for request-scoped correlation
        const trace = (0, trace_store_1.getTraceContext)();
        if (trace) {
            ecs.trace_id = trace.traceId;
        }
        // Structured context: flatten single plain object as top-level fields
        // Sanitize values to avoid ES mapping conflicts (e.g. Error objects → serializable shape)
        let detail;
        if (args.length === 1 &&
            isPlainObject(args[0]) &&
            Object.keys(args[0]).length > 0) {
            const obj = args[0];
            for (const [k, v] of Object.entries(obj)) {
                const key = toSafeElasticFieldName(k);
                ecs[key] = sanitizeForElastic(v);
            }
        }
        else {
            detail = isLocal ? args : JSON.stringify(args);
        }
        // Legacy fields for backward compatibility (component, code, msg)
        const base = {
            ...ecs,
            component: this._name,
            code: event.code,
            msg: event.msg,
        };
        if (detail !== undefined) {
            base.detail = detail;
        }
        // When fallback used: add call site for Kibana/Elasticsearch querying
        if (useFallback) {
            const callSite = getCallSiteForMissingLog();
            if (callSite) {
                base.missing_log_call_site = callSite;
            }
        }
        return base;
    }
    log(logLevel, logEvent, ...args) {
        const payload = this.buildPayload(logLevel, logEvent, args);
        this._logger[logLevel](payload);
    }
    /**
     * Logs an error message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    error(logEvent, ...args) {
        this.log('error', logEvent, ...args);
    }
    /**
     * Logs a warning message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    warn(logEvent, ...args) {
        this.log('warn', logEvent, ...args);
    }
    /**
     * Logs an informational message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    info(logEvent, ...args) {
        this.log('info', logEvent, ...args);
    }
    /**
     * Logs a debug message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    debug(logEvent, ...args) {
        this.log('debug', logEvent, ...args);
    }
    /**
     * Logs a trace message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    trace(logEvent, ...args) {
        this.log('trace', logEvent, ...args);
    }
    /**
     * Runs an async operation and logs its duration.
     * Adds event.duration (ms) for Kibana performance dashboards and alerts.
     *
     * @param logEvent - The event to log on completion
     * @param fn - Async function to execute
     * @param context - Optional context object (flattened as top-level fields)
     * @returns Result of fn
     */
    async withDuration(logEvent, fn, context) {
        const start = Date.now();
        try {
            const result = await fn();
            const durationMs = Date.now() - start;
            const payload = this.buildPayload('info', logEvent, [
                { ...context, duration_ms: durationMs, success: true },
            ]);
            this._logger.info(payload);
            return result;
        }
        catch (error) {
            const durationMs = Date.now() - start;
            const errObj = error instanceof Error
                ? { error_message: error.message, error_type: error.constructor.name }
                : {};
            const payload = this.buildPayload('error', logEvent, [
                { ...context, ...errObj, duration_ms: durationMs, success: false },
            ]);
            this._logger.error(payload);
            throw error;
        }
    }
}
exports.default = Logger;
