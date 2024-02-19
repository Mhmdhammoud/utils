/**
 * Log levels
 */
export type LOG_LEVEL = 'error' | 'warn' | 'info' | 'debug' | 'trace';
/**
 * Represents a log event.
 */
export interface LogEvent {
    /**
     * The code associated with the log event.
     */
    code: string;
    /**
     * The message describing the log event.
     */
    msg: string;
}
/**
 * Configuration options for Elasticsearch.
 */
export interface ElasticConfig {
    /**
     * The Elasticsearch index to write logs to.
     */
    index?: string;
    /**
     * The URL of the Elasticsearch node.
     */
    node?: string;
    /**
     * Authentication details for accessing Elasticsearch.
     */
    auth?: {
        /**
         * The username for authentication.
         */
        username: string;
        /**
         * The password for authentication.
         */
        password: string;
    };
    /**
     * The interval (in milliseconds) at which logs are flushed to Elasticsearch.
     */
    flushInterval?: number;
}
