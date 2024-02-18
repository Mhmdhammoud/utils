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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.isValidLogLevel = exports.getLogger = exports.pinoLogger = void 0;
const pino_1 = require("pino");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/**
 * Create pino once
 */
function getLogger() {
    if (!exports.pinoLogger) {
        if (isValidLogLevel(process.env.LOG_LEVEL)) {
            exports.pinoLogger = (0, pino_1.pino)({
                level: process.env.LOG_LEVEL,
                /** TODO: Caution: any sort of formatted time will significantly slow down Pino's performance.
                 * Can un-formatted time be used here? Maybe converted in Kibana import?
                 */
                timestamp: pino_1.stdTimeFunctions.isoTime.bind(pino_1.stdTimeFunctions),
            }, pino_1.pino.destination({
                minLength: 0,
                sync: false,
            }));
        }
    }
    return exports.pinoLogger;
}
exports.getLogger = getLogger;
function isValidLogLevel(level) {
    if (!['error', 'warn', 'info', 'debug', 'trace'].includes(level)) {
        throw new Error(`Invalid log level "${level}": only error, warn, info, debug, trace are valid.`);
    }
    return true;
}
exports.isValidLogLevel = isValidLogLevel;
/**
 * Logger Wrapper
 */
class Logger {
    /**
     * Create Logger Wrapper
     * @param name Loggers related component name
     */
    constructor(name) {
        this._name = name;
        this._logger = getLogger();
    }
    log(logLevel, logEvent, ...args) {
        this._logger[logLevel]({
            component: this._name,
            ...logEvent,
            detail: args,
        });
    }
    /**
     * Logger API
     */
    error(logEvent, ...args) {
        this.log('error', logEvent, ...args);
    }
    warn(logEvent, ...args) {
        this.log('warn', logEvent, ...args);
    }
    info(logEvent, ...args) {
        this.log('info', logEvent, ...args);
    }
    debug(logEvent, ...args) {
        this.log('debug', logEvent, ...args);
    }
    trace(logEvent, ...args) {
        this.log('trace', logEvent, ...args);
    }
}
exports.Logger = Logger;
