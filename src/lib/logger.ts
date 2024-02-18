import {Logger as PinoLogger, pino, stdTimeFunctions} from 'pino'
import * as dotenv from 'dotenv'
import pinoElastic from 'pino-elasticsearch'

dotenv.config()

/**
 * Log levels
 */
export type LOG_LEVEL = 'error' | 'warn' | 'info' | 'debug' | 'trace'

/**
 * Represents a log event.
 */
export interface LogEvent {
	/**
	 * The code associated with the log event.
	 */
	code: string
	/**
	 * The message describing the log event.
	 */
	msg: string
}

/**
 * Configuration options for Elasticsearch.
 */
export interface ElasticConfig {
	/**
	 * The Elasticsearch index to write logs to.
	 */
	index?: string
	/**
	 * The URL of the Elasticsearch node.
	 */
	node?: string
	/**
	 * Authentication details for accessing Elasticsearch.
	 */
	auth?: {
		/**
		 * The username for authentication.
		 */
		username: string
		/**
		 * The password for authentication.
		 */
		password: string
	}
	/**
	 * The interval (in milliseconds) at which logs are flushed to Elasticsearch.
	 */
	flushInterval?: number
}

/**
 * Pino logger backend - singleton
 */
let pinoLogger: PinoLogger

/**
 * Creates a Pino logger instance with specified Elasticsearch configuration.
 * @param elasticConfig Optional Elasticsearch configuration.
 * @returns The Pino logger instance.
 */
function getLogger(elasticConfig?: ElasticConfig): PinoLogger {
	if (!pinoLogger) {
		if (isValidLogLevel(process.env.LOG_LEVEL)) {
			const transports = []
			if (process.env.NODE_ENV !== 'local') {
				const esConfig: ElasticConfig = {
					index: process.env.SERVER_NICKNAME,
					node: process.env.ELASTICSEARCH_NODE,
					auth: {
						username: process.env.ELASTICSEARCH_USERNAME,
						password: process.env.ELASTICSEARCH_PASSWORD,
					},
					flushInterval: 10000,
				}
				if (elasticConfig) {
					Object.assign(esConfig, elasticConfig)
				}
				const esTransport = pinoElastic(esConfig)
				transports.push(esTransport)
			} else {
				transports.push(
					pino.destination({
						minLength: 0,
						sync: false,
					})
				)
			}
			pinoLogger = pino(
				{
					level: process.env.LOG_LEVEL,
					timestamp: stdTimeFunctions.isoTime.bind(stdTimeFunctions),
				},
				...transports
			)
		}
	}
	return pinoLogger
}

/**
 * Checks if a given log level is valid.
 * @param level The log level to check.
 * @returns Whether the log level is valid.
 */
function isValidLogLevel(level: string): level is LOG_LEVEL {
	if (!['error', 'warn', 'info', 'debug', 'trace'].includes(level)) {
		throw new Error(
			`Invalid log level "${level}": only error, warn, info, debug, trace are valid.`
		)
	}
	return true
}

/**
 * Logger Wrapper.
 * Wraps a Pino logger instance and provides logging methods.
 */
class Logger {
	private readonly _name: string
	private readonly _logger: PinoLogger

	/**
	 * Creates a Logger instance with default configuration or custom Elasticsearch configuration.
	 * @param name The name of the component associated with the logger.
	 * @param elasticConfig Optional Elasticsearch configuration.
	 */
	constructor(name: string, elasticConfig?: ElasticConfig) {
		this._name = name
		this._logger = getLogger(elasticConfig)
	}

	private log(logLevel: LOG_LEVEL, logEvent: LogEvent, ...args: unknown[]) {
		this._logger[logLevel]({
			component: this._name,
			...logEvent,
			detail: args,
		})
	}

	/**
	 * Logs an error message.
	 * @param logEvent The event to log.
	 * @param args Additional arguments to include in the log.
	 */
	error(logEvent: LogEvent, ...args: unknown[]) {
		this.log('error', logEvent, ...args)
	}

	/**
	 * Logs a warning message.
	 * @param logEvent The event to log.
	 * @param args Additional arguments to include in the log.
	 */
	warn(logEvent: LogEvent, ...args: unknown[]) {
		this.log('warn', logEvent, ...args)
	}

	/**
	 * Logs an informational message.
	 * @param logEvent The event to log.
	 * @param args Additional arguments to include in the log.
	 */
	info(logEvent: LogEvent, ...args: unknown[]) {
		this.log('info', logEvent, ...args)
	}

	/**
	 * Logs a debug message.
	 * @param logEvent The event to log.
	 * @param args Additional arguments to include in the log.
	 */
	debug(logEvent: LogEvent, ...args: unknown[]) {
		this.log('debug', logEvent, ...args)
	}

	/**
	 * Logs a trace message.
	 * @param logEvent The event to log.
	 * @param args Additional arguments to include in the log.
	 */
	trace(logEvent: LogEvent, ...args: unknown[]) {
		this.log('trace', logEvent, ...args)
	}
}

export default Logger
