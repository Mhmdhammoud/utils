import {ElasticsearchTransport} from 'winston-elasticsearch'
import * as dotenv from 'dotenv'
dotenv.config()
const {
	ELASTICSEARCH_USERNAME,
	ELASTICSEARCH_PASSWORD,
	ELASTICSEARCH_NODE,
	SERVER_NICKNAME,
	LOG_LEVEL,
} = process.env

const transports =
	process.env.NODE_ENV !== 'local'
		? [
				// Elasticsearch Transport for 'info' logs
				new ElasticsearchTransport({
					level: 'info',
					indexPrefix: process.env.SERVER_NICKNAME, // Index prefix for Elasticsearch
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
				new ElasticsearchTransport({
					level: LOG_LEVEL,
					indexPrefix: SERVER_NICKNAME, // Index prefix for Elasticsearch
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
				new ElasticsearchTransport({
					level: 'error',
					indexPrefix: process.env.SERVER_NICKNAME, // Index prefix for Elasticsearch
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
		: []

const loggerConfiguration = {
	transports,
}

export default loggerConfiguration
