import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

/**
 * Trace context for request-scoped correlation in Kibana.
 * Enables filtering all logs from a single request/job by trace.id.
 */
export interface TraceContext {
	/** Unique ID for the entire request/job flow */
	traceId: string
	/** Optional span ID for sub-operations */
	spanId?: string
}

const traceStorage = new AsyncLocalStorage<TraceContext>()

/**
 * Run an async function with a new trace context.
 * All Logger calls within the callback will automatically include trace.id.
 *
 * @param fn - Async function to run within the trace context
 * @param traceId - Optional trace ID (defaults to random UUID)
 * @returns Result of fn
 */
export const runWithTrace = async <T>(
	fn: () => Promise<T>,
	traceId?: string
): Promise<T> => {
	const id = traceId ?? randomUUID()
	return traceStorage.run({ traceId: id }, () => fn())
}

/**
 * Run a sync function with a new trace context.
 */
export const runWithTraceSync = <T>(fn: () => T, traceId?: string): T => {
	const id = traceId ?? randomUUID()
	return traceStorage.run({ traceId: id }, () => fn())
}

/**
 * Get the current trace context (if running inside runWithTrace).
 */
export const getTraceContext = (): TraceContext | undefined => {
	return traceStorage.getStore()
}
