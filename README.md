# Meritt Utility functions

This is a collection of utility functions that are often used in Meritt projects.

## Actions

[![Changes](https://github.com/Mhmdhammoud/meritt-utils/actions/workflows/push.yml/badge.svg)](https://github.com/Mhmdhammoud/meritt-utils/actions/workflows/push.yml) [![NPM Publish on Release](https://github.com/Mhmdhammoud/meritt-utils/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Mhmdhammoud/meritt-utils/actions/workflows/npm-publish.yml)

## Installation

For npm:

```bash
npm install @mhmdhammoud/meritt-utils
```

or for yarn:

```bash
yarn add @mhmdhammoud/meritt-utils
```

## Usage

```typescript
// Import the classes you need
import {Crypto, Formatter} from '@mhmdhammoud/meritt-utils'

// Example of creating a product slug
const slug = Formatter.slugify('My Product Name') // my-product-name

// Example of encrypting and decrypting a string

const encryptedMessage = Crypto.encrypt('Hello World', 7) // [23,235,141,414]
```

### Application-owned shutdown

Applications that drain workers or requests before exiting should disable the
logger's automatic SIGTERM/SIGINT shutdown (globally, before or after creating
logger instances):

```ts
Logger.disableAutomaticShutdown()
// In your application's shutdown handler, after workers and other services close:
await Logger.close()
// The application can now exit.
```

`Logger.close()` flushes and ends the shared Elasticsearch transport once without
exiting. Call it after the last log message; it rejects on transport failure or
a five-second timeout. Automatic shutdown remains enabled by default.
