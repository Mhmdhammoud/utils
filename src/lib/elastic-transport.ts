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
import { Readable } from 'stream'
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

function initializeBulkHandler(
	opts: ElasticTransportOptions,
	client: Client,
	splitter: NodeJS.ReadWriteStream
): void {
	const esVersion = Number(opts.esVersion ?? opts['es-version'] ?? 7)
	const index = opts.index ?? 'pino'
	const buildIndexName = typeof index === 'function' ? index : null
	const opType = esVersion >= 7 ? undefined : undefined

	// CRITICAL FIX (issue #140): When bulk helper destroys stream after retries exhausted,
	// we must BOTH resurrect the pool AND reinitialize the bulk handler so logging continues.
	// connectionPool.resurrect exists at runtime (elastic-transport) but may not be in types
	const pool = client.connectionPool as {
		resurrect?: (opts: { name: string }) => void
	}
	const splitterWithDestroy = splitter as NodeJS.ReadWriteStream & {
		destroy: (err?: Error) => void
	}
	splitterWithDestroy.destroy = function () {
		if (typeof pool.resurrect === 'function') {
			pool.resurrect({ name: 'elasticsearch-js' })
		}
		// Reinitialize bulk handler - without this, logging stops permanently until restart
		initializeBulkHandler(opts, client, splitter)
	}

	const indexName = (time = new Date().toISOString()) =>
		buildIndexName ? buildIndexName(time) : getIndexName(index as string, time)

	const bulkInsert = client.helpers.bulk({
		datasource: splitter as unknown as Readable,
		flushBytes: opts.flushBytes ?? opts['flush-bytes'] ?? 1000,
		flushInterval: opts.flushInterval ?? opts['flush-interval'] ?? 3000,
		refreshOnCompletion: false,
		onDocument(doc: unknown) {
			const d = doc as LogDocument
			const date = d.time ?? d['@timestamp'] ?? new Date().toISOString()
			if (opType === 'create') {
				d['@timestamp'] = date
			}
			return {
				index: {
					_index: indexName(date),
					op_type: opType,
				},
			}
		},
		onDrop(doc: unknown) {
			const error = new Error('Dropped document') as Error & {
				document: unknown
			}
			error.document = doc
			splitter.emit('insertError', error)
		},
	})

	bulkInsert.then(
		(stats) => splitter.emit('insert', stats),
		(err) => splitter.emit('error', err)
	)
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

	client.diagnostic.on('resurrect', () => {
		initializeBulkHandler(opts, client, splitter)
	})

	initializeBulkHandler(opts, client, splitter)

	return splitter
}
