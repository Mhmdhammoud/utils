"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importStar(require("../lib/logger"));
const pino_1 = require("pino");
jest.mock('pino');
const LOGGER_NAME = 'logger-name';
const PINO_DESTINATION = {};
const PINO = {
    info: jest.fn(),
};
describe('create logger wrapper', () => {
    test('initially create & configure logger', () => {
        //@ts-ignore
        const mock_pino_destination = jest
            .spyOn(pino_1.pino, 'destination')
            //@ts-ignore
            .mockReturnValue(PINO_DESTINATION);
        //@ts-ignore
        const mock_pino = pino_1.pino.mockReturnValue(PINO);
        /** create logger */
        const logger = new logger_1.default(LOGGER_NAME);
        expect(logger).toBeDefined();
        expect(logger['_name']).toBe(LOGGER_NAME);
        expect(mock_pino).toHaveBeenCalledTimes(1);
        expect(mock_pino).toHaveBeenCalledWith({
            level: 'info',
            timestamp: expect.any(Function),
        }, PINO_DESTINATION);
        expect(mock_pino_destination).toHaveBeenCalledWith({
            minLength: 1024,
            sync: true,
        });
    });
    test('create repeatedly - stick to pino singleton', () => {
        //@ts-ignore
        jest.spyOn(pino_1.pino, 'destination').mockReturnValue(PINO_DESTINATION);
        //@ts-ignore
        const mock_pino = pino_1.pino.mockReturnValue(PINO);
        new logger_1.default(LOGGER_NAME);
        expect(mock_pino).toHaveBeenCalledTimes(1);
        /** create additional logger */
        new logger_1.default(LOGGER_NAME);
        /** no new pino created */
        expect(mock_pino).toHaveBeenCalledTimes(1);
    });
});
describe('validate log level', () => {
    test('throw on invalid log level', () => {
        const INVALID_LOG_LEVEL = 'invalid-log-level';
        expect(() => {
            (0, logger_1.isValidLogLevel)(INVALID_LOG_LEVEL);
        }).toThrowError(`Invalid log level "${INVALID_LOG_LEVEL}": only error, warn, info, debug, trace are valid.`);
    });
});
describe('route and format logs', () => {
    const LOG_EVENT = {
        code: 'code',
        msg: 'message',
    };
    const DETAILS = {
        key0: 'val0',
        key1: 'val1',
    };
    test('log info with details', () => {
        //@ts-ignore
        jest.spyOn(pino_1.pino, 'destination').mockReturnValue(PINO_DESTINATION);
        //@ts-ignore
        pino_1.pino.mockReturnValue(PINO);
        const logger = new logger_1.default(LOGGER_NAME);
        logger.info(LOG_EVENT, DETAILS);
        expect(PINO.info).toHaveBeenCalledWith({
            component: LOGGER_NAME,
            ...LOG_EVENT,
            detail: [DETAILS],
        });
    });
});
