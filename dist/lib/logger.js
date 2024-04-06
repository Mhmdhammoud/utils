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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLogLevel = void 0;
const pino_1 = require("pino");
const dotenv = __importStar(require("dotenv"));
const pino_elasticsearch_1 = __importDefault(require("pino-elasticsearch"));
dotenv.config();
/**
 * Pino logger backend - singleton
 */
let pinoLogger;
/**
 * Creates a Pino logger instance with specified Elasticsearch configuration.
 * @param elasticConfig - Optional Elasticsearch configuration.
 * @returns The Pino logger instance.
 */
function getLogger(elasticConfig) {
    if (!pinoLogger) {
        if (isValidLogLevel(process.env.LOG_LEVEL)) {
            const transports = [];
            if (process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'test') {
                const esConfig = {
                    index: process.env.SERVER_NICKNAME,
                    node: process.env.ELASTICSEARCH_NODE,
                    auth: {
                        username: process.env.ELASTICSEARCH_USERNAME,
                        password: process.env.ELASTICSEARCH_PASSWORD,
                    },
                    flushInterval: 1000,
                    'flush-bytes': 1000,
                };
                if (elasticConfig) {
                    Object.assign(esConfig, elasticConfig);
                }
                const esTransport = (0, pino_elasticsearch_1.default)(esConfig);
                transports.push(esTransport);
            }
            else {
                transports.push(pino_1.pino.destination({
                    minLength: 128,
                    sync: false,
                }));
            }
            pinoLogger = (0, pino_1.pino)({
                level: process.env.LOG_LEVEL,
                timestamp: pino_1.stdTimeFunctions.isoTime.bind(pino_1.stdTimeFunctions),
            }, ...transports);
        }
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
exports.isValidLogLevel = isValidLogLevel;
/**
 * Logger Wrapper.
 * Wraps a Pino logger instance and provides logging methods.
 */
class Logger {
    constructor(name, elasticConfig) {
        this._name = name;
        this._logger = getLogger(elasticConfig);
    }
    log(logLevel, logEvent, ...args) {
        let detail;
        if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test') {
            detail = args;
        }
        else {
            //@ts-ignore
            detail = JSON.stringify(...args);
        }
        this._logger[logLevel]({
            component: this._name,
            ...logEvent,
            detail,
        });
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
}
exports.default = Logger;
