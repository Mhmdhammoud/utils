"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceContext = exports.runWithTraceSync = exports.runWithTrace = void 0;
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
const traceStorage = new async_hooks_1.AsyncLocalStorage();
/**
 * Run an async function with a new trace context.
 * All Logger calls within the callback will automatically include trace.id.
 *
 * @param fn - Async function to run within the trace context
 * @param traceId - Optional trace ID (defaults to random UUID)
 * @returns Result of fn
 */
const runWithTrace = async (fn, traceId) => {
    const id = traceId !== null && traceId !== void 0 ? traceId : (0, crypto_1.randomUUID)();
    return traceStorage.run({ traceId: id }, () => fn());
};
exports.runWithTrace = runWithTrace;
/**
 * Run a sync function with a new trace context.
 */
const runWithTraceSync = (fn, traceId) => {
    const id = traceId !== null && traceId !== void 0 ? traceId : (0, crypto_1.randomUUID)();
    return traceStorage.run({ traceId: id }, () => fn());
};
exports.runWithTraceSync = runWithTraceSync;
/**
 * Get the current trace context (if running inside runWithTrace).
 */
const getTraceContext = () => {
    return traceStorage.getStore();
};
exports.getTraceContext = getTraceContext;
