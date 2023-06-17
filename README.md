# Meritt Utility functions

This is a collection of utility functions that are often used in Meritt projects.

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
import {Crypto} from '@mhmdhammoud/meritt-utils'

// Example of getting all Crypto methods
const encryptedMessage = Crypto.encrypt('Hello World', 7)
const decryptedMessage = Crypto.decrypt(encryptedMessage, 7)
```
