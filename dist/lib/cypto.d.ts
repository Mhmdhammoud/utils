/**
 * The Crypto class
 * @class Crypto
 * @example
 * ```typescript
 * import crypto from './lib/crypto'
 * ```
 * */
declare class Crypto {
    private _primeNumberP;
    private _primeNumberQ;
    private _moduloDenominator;
    /**
     * Set the P prime number for the RSA algorithm
     * @param {string} primeP - The prime number P
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.setPrimeP(17)
     * ```
     * */
    setPrimeP(primeP: number): void;
    /**
     * Set the Q prime number for the RSA algorithm
     * @param {string} primeQ - The prime number Q
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.setPrimeQ(19)
     * ```
     * */
    setPrimeQ(primeQ: number): void;
    /**
     *
     * @param {string} base - The base number
     * @param {string} exponent - The exponent number
     * @memberof Crypto
     * @example
     * ```typescript
     * this.modularExponentiation(2, 3)
     * ```
     * */
    private _modularExponentiation;
    /**
     * Encrypt the message using the public key
     * @param {string} message - The message to encrypt
     * @param {string} publicKey - The public key
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.encrypt('Hello World', 7)
     * ```
     * */
    encrypt: (message: string, publicKey: number) => number[];
    /**
     * Decrypt the message using the private key
     * @param {string} encryptedMessage - The ciphertext to decrypt
     * @param {string} privateKey - The private key
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.decrypt([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100], 23)
     * ```
     * */
    decrypt: (encryptedMessage: number[], privateKey: number) => string;
}
declare const crypto: Crypto;
export default crypto;
