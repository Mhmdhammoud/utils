"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elastic_transport_1 = require("../lib/elastic-transport");
const elasticsearch_1 = require("@elastic/elasticsearch");
jest.mock('@elastic/elasticsearch', () => ({
    Client: jest.fn(),
}));
const MockedClient = elasticsearch_1.Client;
const writeLog = (transport, doc) => transport.write(`${JSON.stringify(doc)}\n`);
const waitForEvent = (emitter, eventName) => new Promise((resolve) => {
    emitter.once(eventName, (value) => resolve(value));
});
describe('elastic transport resilience', () => {
    beforeEach(() => {
        jest.useRealTimers();
        MockedClient.mockReset();
    });
    test('disables node sniffing by default', () => {
        MockedClient.mockImplementation(() => ({ bulk: jest.fn() }));
        (0, elastic_transport_1.createElasticTransport)({ index: 'logs' });
        expect(MockedClient).toHaveBeenCalledWith(expect.objectContaining({ sniffOnConnectionFault: false }));
    });
    test('allows node sniffing only when explicitly enabled', () => {
        MockedClient.mockImplementation(() => ({ bulk: jest.fn() }));
        (0, elastic_transport_1.createElasticTransport)({
            index: 'logs',
            sniffOnConnectionFault: true,
        });
        expect(MockedClient).toHaveBeenCalledWith(expect.objectContaining({ sniffOnConnectionFault: true }));
    });
    test('reports bulk failures without emitting terminal stream errors', async () => {
        const bulk = jest
            .fn()
            .mockRejectedValueOnce(new Error('ES unavailable'))
            .mockResolvedValueOnce({ errors: false, items: [] });
        MockedClient.mockImplementation(() => ({ bulk }));
        const transport = (0, elastic_transport_1.createElasticTransport)({
            index: 'logs',
            flushBytes: 1,
            flushInterval: 10000,
            requestTimeout: 10,
        });
        const streamError = jest.fn();
        transport.on('error', streamError);
        const failed = waitForEvent(transport, 'bulkError');
        writeLog(transport, { message: 'first' });
        await failed;
        const inserted = waitForEvent(transport, 'insert');
        writeLog(transport, { message: 'second' });
        await expect(inserted).resolves.toEqual({ successful: 1, failed: 0 });
        expect(streamError).not.toHaveBeenCalled();
        expect(bulk).toHaveBeenCalledTimes(2);
    });
    test('watchdog releases a stuck bulk request so later logs can flush', async () => {
        jest.useFakeTimers();
        const bulk = jest
            .fn()
            .mockReturnValueOnce(new Promise(() => undefined))
            .mockResolvedValueOnce({ errors: false, items: [] });
        MockedClient.mockImplementation(() => ({ bulk }));
        const transport = (0, elastic_transport_1.createElasticTransport)({
            index: 'logs',
            flushBytes: 1,
            flushInterval: 10000,
            requestTimeout: 1,
        });
        const timedOut = waitForEvent(transport, 'bulkError');
        writeLog(transport, { message: 'stuck' });
        await jest.advanceTimersByTimeAsync(5001);
        await expect(timedOut).resolves.toMatchObject({
            message: 'Elasticsearch bulk request timed out after 5001ms',
        });
        const inserted = waitForEvent(transport, 'insert');
        writeLog(transport, { message: 'recovered' });
        await expect(inserted).resolves.toEqual({ successful: 1, failed: 0 });
        expect(bulk).toHaveBeenCalledTimes(2);
    });
});
