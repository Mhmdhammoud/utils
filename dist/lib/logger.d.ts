import { ElasticConfig, LOG_LEVEL, LogEvent } from '../types';
/**
 * Checks if a given log level is valid.
 * @param level - The log level to check.
 * @returns Whether the log level is valid.
 */
export declare function isValidLogLevel(level: string): level is LOG_LEVEL;
/**
 * Logger Wrapper.
 * Wraps a Pino logger instance and provides logging methods.
 */
declare class Logger {
    private readonly _name;
    private readonly _logger;
    /**
     * Creates a new Logger instance with default configuration.
     * @param name - The name of the logger.
     */
    constructor(name: string);
    /**
     * Creates a new Logger instance with custom Elasticsearch configuration.
     * @param name - The name of the logger.
     * @param elasticConfig - Optional Elasticsearch configuration.
     */
    constructor(name: string, elasticConfig?: ElasticConfig);
    private log;
    /**
     * Logs an error message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    error(logEvent: LogEvent, ...args: unknown[]): void;
    /**
     * Logs a warning message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    warn(logEvent: LogEvent, ...args: unknown[]): void;
    /**
     * Logs an informational message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    info(logEvent: LogEvent, ...args: unknown[]): void;
    /**
     * Logs a debug message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    debug(logEvent: LogEvent, ...args: unknown[]): void;
    /**
     * Logs a trace message.
     * @param logEvent - The event to log.
     * @param args - Additional arguments to include in the log.
     */
    trace(logEvent: LogEvent, ...args: unknown[]): void;
}
export default Logger;
