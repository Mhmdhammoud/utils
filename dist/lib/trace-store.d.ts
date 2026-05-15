/**
 * Trace context for request-scoped correlation in Kibana.
 * Enables filtering all logs from a single request/job by trace.id.
 */
export interface TraceContext {
    /** Unique ID for the entire request/job flow */
    traceId: string;
    /** Optional span ID for sub-operations */
    spanId?: string;
}
/**
 * Run an async function with a new trace context.
 * All Logger calls within the callback will automatically include trace.id.
 *
 * @param fn - Async function to run within the trace context
 * @param traceId - Optional trace ID (defaults to random UUID)
 * @returns Result of fn
 */
export declare const runWithTrace: <T>(fn: () => Promise<T>, traceId?: string) => Promise<T>;
/**
 * Run a sync function with a new trace context.
 */
export declare const runWithTraceSync: <T>(fn: () => T, traceId?: string) => T;
/**
 * Get the current trace context (if running inside runWithTrace).
 */
export declare const getTraceContext: () => TraceContext | undefined;
