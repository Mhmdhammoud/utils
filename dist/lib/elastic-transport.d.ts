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
import type { ClientOptions } from '@elastic/elasticsearch';
export interface ElasticTransportOptions extends Pick<ClientOptions, 'node' | 'auth' | 'cloud' | 'caFingerprint' | 'Connection' | 'ConnectionPool' | 'maxRetries' | 'requestTimeout'> {
    sniffOnConnectionFault?: boolean;
    index?: string | ((logTime: string) => string);
    flushBytes?: number;
    'flush-bytes'?: number;
    flushInterval?: number;
    'flush-interval'?: number;
    esVersion?: number;
    'es-version'?: number;
    rejectUnauthorized?: boolean;
    tls?: ClientOptions['tls'];
}
export declare const createElasticTransport: (opts?: ElasticTransportOptions) => NodeJS.ReadWriteStream;
