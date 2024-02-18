import { ElasticsearchTransport } from 'winston-elasticsearch';
declare const loggerConfiguration: {
    transports: ElasticsearchTransport[];
};
export default loggerConfiguration;
