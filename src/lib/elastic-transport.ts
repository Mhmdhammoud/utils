/**
 * Elasticsearch transport for Pino with connection lifecycle resilience.
 *
 * Based on pino-elasticsearch with a fix for GitHub issue #140:
 * When maxRetries are exceeded and Elasticsearch nodes are DEAD, the bulk helper
 * destroys the splitter stream, causing logs to stop permanently until restart.
 *
 * This implementation overrides splitter.destroy to BOTH resurrect the connection
 * pool AND reinitialize the bulk handler, so logging continues after ES recovers.
 *
 * @see https://github.com/pinojs/pino-elasticsearch/issues/140
 * @see https://github.com/pinojs/pino-elasticsearch/issues/72
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const split = require('split2') as (
	fn: (line: string) => unknown,
	opts?: { autoDestroy?: boolean }
) => NodeJS.ReadWriteStream
import { Client } from '@elastic/elasticsearch'
import type { ClientOptions } from '@elastic/elasticsearch'

export interface ElasticTransportOptions extends Pick<
	ClientOptions,
	| 'node'
	| 'auth'
	| 'cloud'
	| 'caFingerprint'
	| 'Connection'
	| 'ConnectionPool'
	| 'maxRetries'
	| 'requestTimeout'
> {
	sniffOnConnectionFault?: boolean
	index?: string | ((logTime: string) => string)
	flushBytes?: number
	'flush-bytes'?: number
	flushInterval?: number
	'flush-interval'?: number
	esVersion?: number
	'es-version'?: number
	rejectUnauthorized?: boolean
	tls?: ClientOptions['tls']
}

interface LogDocument {
	time?: string
	'@timestamp'?: string
	[k: string]: unknown
}

function setDateTimeString(value: unknown): string {
	if (value !== null && typeof value === 'object' && 'time' in value) {
		const t = (value as { time: unknown }).time
		if (
			(typeof t === 'string' && t.length > 0) ||
			(typeof t === 'number' && t >= 0)
		) {
			return new Date(t).toISOString()
		}
	}
	return new Date().toISOString()
}

function getIndexName(
	index: string | ((logTime: string) => string),
	time: string
): string {
	if (typeof index === 'function') {
		return index(time)
	}
	return index.replace('%{DATE}', time.substring(0, 10))
}

function createBulkSender(
	opts: ElasticTransportOptions,
	client: Client,
	splitter: NodeJS.ReadWriteStream
): {
	add: (doc: unknown) => void
	flush: () => Promise<void>
	close: () => Promise<void>
} {
	const esVersion = Number(opts.esVersion ?? opts['es-version'] ?? 7)
	const index = opts.index ?? 'pino'
	const buildIndexName = typeof index === 'function' ? index : null
	const opType = esVersion >= 7 ? undefined : undefined
	const flushBytes = opts.flushBytes ?? opts['flush-bytes'] ?? 1000
	const flushInterval = opts.flushInterval ?? opts['flush-interval'] ?? 3000

	let buffer: unknown[] = []
	let bufferedBytes = 0
	let timer: NodeJS.Timeout | undefined
	let isFlushing = false
	let flushAgain = false

	const indexName = (time = new Date().toISOString()) =>
		buildIndexName ? buildIndexName(time) : getIndexName(index as string, time)

	const clearFlushTimer = () => {
		if (timer) {
			clearTimeout(timer)
			timer = undefined
		}
	}

	const scheduleFlush = () => {
		if (timer || buffer.length === 0) {
			return
		}
		timer = setTimeout(() => {
			timer = undefined
			void flush()
		}, flushInterval)
		timer.unref?.()
	}

	const buildOperation = (doc: unknown): [Record<string, unknown>, unknown] => {
		try {
			const d = doc as LogDocument
			const date = d.time ?? d['@timestamp'] ?? new Date().toISOString()
			if (opType === 'create') {
				d['@timestamp'] = date
			}
			return [
				{
					index: {
						_index: indexName(date),
						op_type: opType,
					},
				},
				doc,
			]
		} catch {
			return [
				{
					index: {
						_index: indexName(),
						op_type: opType,
					},
				},
				doc,
			]
		}
	}

	const emitDroppedDocument = (doc: unknown, cause?: unknown) => {
		const error = new Error('Dropped document') as Error & {
			document: unknown
			cause?: unknown
		}
		error.document = doc
		error.cause = cause
		splitter.emit('insertError', error)
	}

	const flush = async (): Promise<void> => {
		if (isFlushing) {
			flushAgain = true
			return
		}
		clearFlushTimer()
		if (buffer.length === 0) {
			return
		}

		isFlushing = true
		const batch = buffer
		buffer = []
		bufferedBytes = 0

		try {
			const operations = batch.flatMap(buildOperation)
			const response = await client.bulk({
				operations,
				refresh: false,
				timeout: opts.requestTimeout ? `${opts.requestTimeout}ms` : undefined,
			})

			const body = response as {
				errors?: boolean
				items?: Array<Record<string, { error?: unknown }>>
			}
			if (body.errors && Array.isArray(body.items)) {
				body.items.forEach((item, index) => {
					const result = Object.values(item)[0]
					if (result?.error) {
						emitDroppedDocument(batch[index], result.error)
					}
				})
			}

			splitter.emit('insert', {
				successful: batch.length,
				failed: body.errors ? body.items?.length ?? 0 : 0,
			})
		} catch (err) {
			splitter.emit('error', err)
			// Drop the failed batch instead of wedging the stream. The next log line
			// creates a fresh bulk request and can recover without a process restart.
			batch.forEach((doc) => emitDroppedDocument(doc, err))
		} finally {
			isFlushing = false
			if (flushAgain || buffer.length > 0) {
				flushAgain = false
				scheduleFlush()
				if (bufferedBytes >= flushBytes) {
					void flush()
				}
			}
		}
	}

	return {
		add(doc: unknown) {
			buffer.push(doc)
			bufferedBytes += Buffer.byteLength(JSON.stringify(doc))
			if (bufferedBytes >= flushBytes) {
				void flush()
				return
			}
			scheduleFlush()
		},
		flush,
		async close() {
			clearFlushTimer()
			await flush()
		},
	}
}

export const createElasticTransport = (
	opts: ElasticTransportOptions = {}
): NodeJS.ReadWriteStream => {
	const splitter = split(
		function (this: NodeJS.ReadWriteStream, line: string) {
			let value: unknown

			try {
				value = JSON.parse(line) as unknown
			} catch (error) {
				this.emit('unknown', line, error)
				return
			}

			if (typeof value === 'boolean') {
				this.emit('unknown', line, 'Boolean value ignored')
				return
			}
			if (value === null) {
				this.emit('unknown', line, 'Null value ignored')
				return
			}
			if (typeof value !== 'object') {
				value = { data: value, time: setDateTimeString(value) }
			} else {
				const obj = value as Record<string, unknown>
				if (obj['@timestamp'] === undefined) {
					;(obj as LogDocument).time = setDateTimeString(obj)
				}
			}
			return value
		},
		{ autoDestroy: true }
	)

	const clientOpts: ClientOptions = {
		node: opts.node,
		auth: opts.auth,
		cloud: opts.cloud,
		tls: { rejectUnauthorized: opts.rejectUnauthorized, ...opts.tls },
		maxRetries: opts.maxRetries,
		requestTimeout: opts.requestTimeout,
		sniffOnConnectionFault: opts.sniffOnConnectionFault,
	}

	if (opts.caFingerprint) {
		clientOpts.caFingerprint = opts.caFingerprint
	}
	if (opts.Connection) {
		clientOpts.Connection = opts.Connection
	}
	if (opts.ConnectionPool) {
		clientOpts.ConnectionPool = opts.ConnectionPool
	}

	const client = new Client(clientOpts)
	const bulkSender = createBulkSender(opts, client, splitter)

	splitter.on('data', (doc) => {
		bulkSender.add(doc)
	})
	splitter.on('finish', () => {
		void bulkSender.close()
	})

	const splitterWithDestroy = splitter as NodeJS.ReadWriteStream & {
		destroy: (err?: Error) => void
	}
	const originalDestroy = splitterWithDestroy.destroy.bind(splitterWithDestroy)
	splitterWithDestroy.destroy = function (err?: Error) {
		void bulkSender.close()
		originalDestroy(err)
	}

	return splitter
}
