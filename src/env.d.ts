declare namespace NodeJS {
	export interface ProcessEnv {
		NODE_ENV: 'development' | 'production' | 'test' | 'local'
		ELASTICSEARCH_NODE: string
		ELASTICSEARCH_USERNAME: string
		ELASTICSEARCH_PASSWORD: string
		LOG_LEVEL: string
	}
}
