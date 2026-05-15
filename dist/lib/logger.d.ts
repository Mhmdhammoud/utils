import { LOG_LEVEL, LogEvent, ElasticConfig } from '../types';
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
    /**
     * Build ECS-aligned and structured log payload.
     * - ECS: log.level, log.logger, event.code, service.name, service.environment, message
     * - Structured: Single plain object flattened as top-level snake_case fields (Kibana filterable)
     * - Trace: trace.id when running inside runWithTrace
     */
    private buildPayload;
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
    /**
     * Runs an async operation and logs its duration.
     * Adds event.duration (ms) for Kibana performance dashboards and alerts.
     *
     * @param logEvent - The event to log on completion
     * @param fn - Async function to execute
     * @param context - Optional context object (flattened as top-level fields)
     * @returns Result of fn
     */
    withDuration<T>(logEvent: LogEvent, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T>;
}
export default Logger;
