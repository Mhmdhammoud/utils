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
const winston_elasticsearch_1 = require("winston-elasticsearch");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const { ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, ELASTICSEARCH_NODE, SERVER_NICKNAME, LOG_LEVEL, } = process.env;
const transports = process.env.NODE_ENV !== 'local'
    ? [
        // Elasticsearch Transport for 'info' logs
        new winston_elasticsearch_1.ElasticsearchTransport({
            level: 'info',
            indexPrefix: process.env.SERVER_NICKNAME,
            clientOpts: {
                node: ELASTICSEARCH_NODE,
                tls: {
                    rejectUnauthorized: false, // Only for development, not recommended in production
                },
                auth: {
                    username: ELASTICSEARCH_USERNAME,
                    password: ELASTICSEARCH_PASSWORD,
                },
            },
            // format: winston.format.combine(winston.format.json()), // Adjust as needed
        }),
        // Elasticsearch Transport for 'warn' logs
        new winston_elasticsearch_1.ElasticsearchTransport({
            level: LOG_LEVEL,
            indexPrefix: SERVER_NICKNAME,
            clientOpts: {
                node: ELASTICSEARCH_NODE,
                tls: {
                    rejectUnauthorized: false, // Only for development, not recommended in production
                },
                auth: {
                    username: ELASTICSEARCH_USERNAME,
                    password: ELASTICSEARCH_PASSWORD,
                },
            },
            // format: winston.format.combine(winston.format.json()), // Adjust as needed
        }),
        // Elasticsearch Transport for 'error' logs
        new winston_elasticsearch_1.ElasticsearchTransport({
            level: 'error',
            indexPrefix: process.env.SERVER_NICKNAME,
            clientOpts: {
                node: ELASTICSEARCH_NODE,
                tls: {
                    rejectUnauthorized: false, // Only for development, not recommended in production
                },
                auth: {
                    username: ELASTICSEARCH_USERNAME,
                    password: ELASTICSEARCH_PASSWORD,
                },
            },
            // format: winston.format.combine(winston.format.json()), // Adjust as needed
        }),
        // eslint-disable-next-line no-mixed-spaces-and-tabs
    ]
    : [];
const loggerConfiguration = {
    transports,
};
exports.default = loggerConfiguration;
