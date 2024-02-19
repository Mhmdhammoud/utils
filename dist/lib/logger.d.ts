import { Logger as PinoLogger } from 'pino';
/**
 * Log levels
 */
export type LOG_LEVEL = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export interface LogEvent {
    code: string;
    msg: string;
}
/**
 * Pino logger backend - singleton
 */
export declare let pinoLogger: PinoLogger;
/**
 * Create pino once
 */
export declare function getLogger(): PinoLogger<never>;
export declare function isValidLogLevel(level: string): level is LOG_LEVEL;
/**
 * Logger Wrapper
 */
export declare class Logger {
    private readonly _name;
    private readonly _logger;
    /**
     * Create Logger Wrapper
     * @param name Loggers related component name
     */
    constructor(name: string);
    private log;
    /**
     * Logger API
     */
    error(logEvent: LogEvent, ...args: unknown[]): void;
    warn(logEvent: LogEvent, ...args: unknown[]): void;
    info(logEvent: LogEvent, ...args: unknown[]): void;
    debug(logEvent: LogEvent, ...args: unknown[]): void;
    trace(logEvent: LogEvent, ...args: unknown[]): void;
}
