import Logger, {isValidLogLevel} from '../lib/logger'
import {pino} from 'pino'

jest.mock('pino')

const LOGGER_NAME = 'logger-name'
const PINO_DESTINATION = {}
const PINO = {
	info: jest.fn(),
}

describe('create logger wrapper', () => {
	test('initially create & configure logger', () => {
		//@ts-ignore
		const mock_pino_destination = jest
			.spyOn(pino, 'destination')
			//@ts-ignore
			.mockReturnValue(PINO_DESTINATION)
		//@ts-ignore
		const mock_pino = pino.mockReturnValue(PINO)

		/** create logger */
		const logger = new Logger(LOGGER_NAME)

		expect(logger).toBeDefined()
		expect(logger['_name']).toBe(LOGGER_NAME)
		expect(mock_pino).toHaveBeenCalledTimes(1)
		expect(mock_pino).toHaveBeenCalledWith(
			{
				level: 'info',
				timestamp: expect.any(Function),
			},
			PINO_DESTINATION
		)
		expect(mock_pino_destination).toHaveBeenCalledWith({
			minLength: 1024,
			sync: true,
		})
	})
	test('create repeatedly - stick to pino singleton', () => {
		//@ts-ignore
		jest.spyOn(pino, 'destination').mockReturnValue(PINO_DESTINATION)
		//@ts-ignore
		const mock_pino = pino.mockReturnValue(PINO)
		new Logger(LOGGER_NAME)
		expect(mock_pino).toHaveBeenCalledTimes(1)

		/** create additional logger */
		new Logger(LOGGER_NAME)
		/** no new pino created */
		expect(mock_pino).toHaveBeenCalledTimes(1)
	})
})
describe('validate log level', () => {
	test('throw on invalid log level', () => {
		const INVALID_LOG_LEVEL = 'invalid-log-level'
		expect(() => {
			isValidLogLevel(INVALID_LOG_LEVEL)
		}).toThrowError(
			`Invalid log level "${INVALID_LOG_LEVEL}": only error, warn, info, debug, trace are valid.`
		)
	})
})
describe('route and format logs', () => {
	const LOG_EVENT = {
		code: 'code',
		msg: 'message',
	}
	const DETAILS = {
		key0: 'val0',
		key1: 'val1',
	}
	test('log info with details', () => {
		//@ts-ignore
		jest.spyOn(pino, 'destination').mockReturnValue(PINO_DESTINATION)
		//@ts-ignore
		pino.mockReturnValue(PINO)
		const logger = new Logger(LOGGER_NAME)

		logger.info(LOG_EVENT, DETAILS)

		expect(PINO.info).toHaveBeenCalledWith({
			component: LOGGER_NAME,
			...LOG_EVENT,
			detail: [DETAILS],
		})
	})
})
