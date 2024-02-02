import Winston, {Logger as WinstonLogger, LoggerOptions} from 'winston'
import {WinstonConfiguaration} from '../config'

/**
 * Represents a log message with structured information.
 */
interface LogMessage {
	/**
	 * The name of the class that generated the log.
	 */
	className: string

	/**
	 * The name of the function that generated the log.
	 */
	functionName: string

	/**
	 * The log message text.
	 */
	logMessage: string

	/**
	 * The user's IP address associated with the log.
	 */
	userIp: string

	/**
	 * Additional data associated with the log.
	 */
	data?: Record<string, any>
}

/**
 * Service for logging information, warnings, and errors using Winston.
 */
class LoggerService {
	private logger: WinstonLogger

	/**
	 * Creates an instance of LoggerService.
	 * @param config - The configuration options for Winston logger.
	 */
	constructor(config: LoggerOptions) {
		this.logger = Winston.createLogger({
			...config,
			level: process.env.LOG_LEVEL,
		})
		if (process.env.NODE_ENV === 'local') {
			this.logger.add(
				new Winston.transports.Console({
					level: 'info',
					format: Winston.format.combine(
						Winston.format.simple(),
						Winston.format.colorize(),
						Winston.format.printf(({level, message}) => {
							return `[${level}]: ${JSON.stringify(message)}`
							// Parse the message as JSON and include in the log
						})
					),
				})
			)
		}

		this.logger.level = process.env.LOG_LEVEL
	}

	/**
	 * Logs an informational message.
	 * @param className - The name of the class that generated the log.
	 * @param functionName - The name of the function that generated the log.
	 * @param logMessage - The log message text.
	 * @param userIp - The user's IP address associated with the log.
	 * @param data - Additional data associated with the log.
	 */
	info(
		className: string,
		functionName: string,
		logMessage: string,
		userIp: string
	): void {
		const message = this.createLogMessage(
			className,
			functionName,
			logMessage,
			userIp
		)
		this.log('info', message)
	}

	/**
	 * Logs a warning message.
	 * @param className - The name of the class that generated the log.
	 * @param functionName - The name of the function that generated the log.
	 * @param logMessage - The log message text.
	 * @param userIp - The user's IP address associated with the log.
	 * @param data - Additional data associated with the log.
	 */
	warn(
		className: string,
		functionName: string,
		logMessage: string,
		userIp: string
	): void {
		const message = this.createLogMessage(
			className,
			functionName,
			logMessage,
			userIp
		)
		this.log('warn', message)
	}

	/**
	 * Logs an error message.
	 * @param className - The name of the class that generated the log.
	 * @param functionName - The name of the function that generated the log.
	 * @param logMessage - The log message text.
	 * @param userIp - The user's IP address associated with the log.
	 * @param data - Additional data associated with the log.
	 */
	error(
		className: string,
		functionName: string,
		logMessage: string,
		userIp: string,
		data: Object = {}
	): void {
		const message = this.createLogMessage(
			className,
			functionName,
			logMessage,
			userIp,
			data
		)
		this.log('error', message)
	}

	private createLogMessage(
		className: string,
		functionName: string,
		logMessage: string,
		userIp: string,
		data: Record<string, any> = {}
	): LogMessage {
		return {
			className,
			functionName,
			logMessage,
			userIp,
			data,
		}
	}

	private log(level: string, logMessage: LogMessage): void {
		this.logger.log({
			level,
			//@ts-ignore
			message: logMessage,
		})
		process.on('unhandledRejection', (reason, promise) => {
			this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
		})

		process.on('uncaughtException', (err) => {
			this.logger.error('Uncaught Exception:', err)
		})
	}
}

const Logger = new LoggerService(WinstonConfiguaration)
export default Logger
