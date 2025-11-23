# Changes

## Version 1.5.3

### Logger Improvements - Critical Bug Fixes & Production Reliability

#### Critical Fixes

- **Fixed broken JSON.stringify**: Corrected production log serialization from `JSON.stringify(...args)` to `JSON.stringify(args)` - previously only stringified first argument
- **Fixed silent failures**: Logger now throws clear errors when `LOG_LEVEL` is invalid instead of silently failing with undefined logger
- **Fixed return type mismatch**: `getLogger()` now properly returns `PinoLogger` type with explicit error handling
- **Fixed buffer configuration**: Corrected inconsistent buffer settings to match tests (`minLength: 1024, sync: true`)
- **Fixed race condition**: Event listener now registered before calling `.end()` to prevent missed flush events on shutdown

#### Environment Variable Validation

- **Added Elasticsearch validation**: Validates required env vars (`ELASTICSEARCH_NODE`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD`, `SERVER_NICKNAME`) with clear error messages
- **Added integer parsing validation**: All numeric env vars now validated to prevent `NaN` values from breaking configuration
- **Validates positive numbers**: Ensures flush intervals, buffer sizes, retries, and timeouts are positive integers

#### Configurable Settings (New Environment Variables)

- `ES_FLUSH_INTERVAL_MS` - How often to send logs (default: 2000ms = 2 seconds)
- `ES_FLUSH_BYTES` - Buffer size before forcing flush (default: 102400 = 100KB)
- `ES_MAX_RETRIES` - Number of retry attempts on failure (default: 3)
- `ES_REQUEST_TIMEOUT_MS` - Request timeout before retry (default: 30000ms = 30 seconds)

#### Reliability Improvements

- **Error monitoring**: Elasticsearch transport errors now logged to console instead of silent failure
  - `error` event: Connection errors with clear messaging
  - `insertError` event: Document indexing failures
- **Graceful shutdown**: Properly flushes buffered logs before process exit
  - Handles `SIGTERM` and `SIGINT` signals
  - 5-second timeout prevents hanging forever
  - Proper async/await handling to ensure flush completes
- **Auto-reconnection**: `sniffOnConnectionFault: true` enables automatic reconnection when Elasticsearch nodes fail
- **Retry logic**: Configurable retry attempts with timeout for failed requests

#### Type Safety

- **Removed `any` types**: All configurations now use proper TypeScript interfaces
- **Extended ElasticConfig interface**: Added proper types for `maxRetries`, `requestTimeout`, `sniffOnConnectionFault`, and buffer settings
- **Full compile-time validation**: Type system now validates all configuration options

#### Performance

- **Optimized flush settings**: Default 2-second interval with 100KB buffer balances real-time logs with reliability
- **Reduced network overhead**: Larger buffer prevents excessive network calls during high-traffic periods

#### Migration Notes

- All changes are backward compatible
- Default values ensure existing deployments work without changes
- Optional environment variables allow fine-tuning per environment
- No breaking changes to the Logger API

## Version 1.4.1

- Json stringify the log message if its being pushed to Kibana

## Version 1.4.0

- Changed winston logger to Pino logger to improve performance and reduce memory usage

## Version 1.3.0

- Added toUpperTitle method that accepts a string and removes all non alphanumeric characters and capitalizes each letter of every first word

```typescript
import {Logger} from '@mhmdhammoud/meritt-utils'

// Usage Example
Logger.info('className', ' functionName', 'logMessage', 'userIp')
// Available levels info warn error
```

## Version 1.0.5

- Added toUpperTitle method that accepts a string and removes all non alphanumeric characters and capitalizes each letter of every first word

```typescript
import {Formatter} from '@mhmdhammoud/meritt-utils'

// Usage Example
const sentence:string = "hello__world$$99"
console.log(Formatter.toUpperTitle(sentence))

console : Hello World 99

```

## Version 1.0.4

- Added generateKeys method that returns public and private keys

```typescript
import {Crypto} from '@mhmdhammoud/meritt-utils'

// Example of generating a public and a private key
const response = Crypto.generateKeys()
console.log(response)

{
    publicKey:7,
    privateKey:247,
}


```

- Checking for prime numbers discarding even and odd numbers and skips 6 iterations at a time until radical I

## Version 1.0.3

- Added Formatter class for manipulating strings

```typescript
import {Formatter} from '@mhmdhammoud/meritt-utils'

// Example of creating a product slug
const slug = Formatter.slugify('My Product Name') // my-product-name
```

- Fixed bug in Crypto class where encrypting a string with a key that is not a number would throw an error
- Improved Crypto class to allow encrypting and decrypting numbers and objects
- Documented Crypto class

## Version 1.0.2

- Added Crypto class that contains encrypt and decrypt methods for strings, numbers, and objects using a public and private key

```typescript
import {Crypto} from '@mhmdhammoud/meritt-utils'

// Example of encrypting and decrypting a string
const encryptedMessage = Crypto.encrypt('Hello World', 7) // [23,235,141,414]
const decryptedMessage = Crypto.decrypt(encryptedMessage, 247) // Hello World
```
