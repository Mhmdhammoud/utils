# Changes

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
