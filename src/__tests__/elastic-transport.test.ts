import { createElasticTransport } from '../lib/elastic-transport'
import { Client } from '@elastic/elasticsearch'
import { EventEmitter } from 'events'

jest.mock('@elastic/elasticsearch', () => ({
	Client: jest.fn(),
}))

const MockedClient = Client as jest.Mock

const writeLog = (
	transport: NodeJS.WritableStream,
	doc: Record<string, unknown>
) => transport.write(`${JSON.stringify(doc)}\n`)

const waitForEvent = <T = unknown>(
	emitter: EventEmitter,
	eventName: string
): Promise<T> =>
	new Promise((resolve) => {
		emitter.once(eventName, (value) => resolve(value as T))
	})

describe('elastic transport resilience', () => {
	beforeEach(() => {
		jest.useRealTimers()
		MockedClient.mockReset()
	})

	test('reports bulk failures without emitting terminal stream errors', async () => {
		const bulk = jest
			.fn()
			.mockRejectedValueOnce(new Error('ES unavailable'))
			.mockResolvedValueOnce({ errors: false, items: [] })
		MockedClient.mockImplementation(() => ({ bulk }))

		const transport = createElasticTransport({
			index: 'logs',
			flushBytes: 1,
			flushInterval: 10000,
			requestTimeout: 10,
		})
		const streamError = jest.fn()
		transport.on('error', streamError)

		const failed = waitForEvent<Error>(transport, 'bulkError')
		writeLog(transport, { message: 'first' })
		await failed

		const inserted = waitForEvent<{ successful: number; failed: number }>(
			transport,
			'insert'
		)
		writeLog(transport, { message: 'second' })

		await expect(inserted).resolves.toEqual({ successful: 1, failed: 0 })
		expect(streamError).not.toHaveBeenCalled()
		expect(bulk).toHaveBeenCalledTimes(2)
	})

	test('watchdog releases a stuck bulk request so later logs can flush', async () => {
		jest.useFakeTimers()

		const bulk = jest
			.fn()
			.mockReturnValueOnce(new Promise(() => undefined))
			.mockResolvedValueOnce({ errors: false, items: [] })
		MockedClient.mockImplementation(() => ({ bulk }))

		const transport = createElasticTransport({
			index: 'logs',
			flushBytes: 1,
			flushInterval: 10000,
			requestTimeout: 1,
		})

		const timedOut = waitForEvent<Error>(transport, 'bulkError')
		writeLog(transport, { message: 'stuck' })

		await jest.advanceTimersByTimeAsync(5001)
		await expect(timedOut).resolves.toMatchObject({
			message: 'Elasticsearch bulk request timed out after 5001ms',
		})

		const inserted = waitForEvent<{ successful: number; failed: number }>(
			transport,
			'insert'
		)
		writeLog(transport, { message: 'recovered' })

		await expect(inserted).resolves.toEqual({ successful: 1, failed: 0 })
		expect(bulk).toHaveBeenCalledTimes(2)
	})
})
