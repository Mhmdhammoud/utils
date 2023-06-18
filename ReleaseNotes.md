# Changes

## Version 1.0.3

### Added

- Added Formatter class for manipulating strings

```typescript
import {Formatter} from '@mhmdhammoud/meritt-utils'

// Example of creating a product slug
const slug = Formatter.slugify('My Product Name') // my-product-name
```

### Fixes and Improvements

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
