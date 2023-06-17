"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The Crypto class
 * @class Crypto
 * @example
 * ```typescript
 * import crypto from './lib/crypto'
 * ```
 * */
class Crypto {
    constructor() {
        // Default variables
        this._primeNumberP = 17;
        this._primeNumberQ = 19;
        this._moduloDenominator = this._primeNumberP * this._primeNumberQ;
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
        this._modularExponentiation = (base, exponent) => {
            if (this._moduloDenominator === 1) {
                return 0;
            }
            let result = 1;
            base = base % this._moduloDenominator;
            while (exponent > 0) {
                if (exponent % 2 === 1) {
                    result = (result * base) % this._moduloDenominator;
                }
                exponent = Math.floor(exponent / 2);
                base = (base * base) % this._moduloDenominator;
            }
            return result;
        };
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
        this.encrypt = (message, publicKey) => {
            const b = [];
            for (let i = 0; i < message.length; i++) {
                const a = message.charCodeAt(i);
                b.push(this._modularExponentiation(a, publicKey));
            }
            return b;
        };
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
        this.decrypt = (encryptedMessage, privateKey) => {
            const decryptedAsciiMessage = [];
            for (let i = 0; i < encryptedMessage.length; i++) {
                const a = encryptedMessage[i];
                decryptedAsciiMessage.push(this._modularExponentiation(a, privateKey));
            }
            let finalString = '';
            for (let i = 0; i < decryptedAsciiMessage.length; i++) {
                finalString += String.fromCharCode(decryptedAsciiMessage[i]);
            }
            return finalString;
        };
    }
    /**
     * Set the P prime number for the RSA algorithm
     * @param {string} primeP - The prime number P
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.setPrimeP(17)
     * ```
     * */
    setPrimeP(primeP) {
        let isPrime = true;
        for (let i = 2; i < primeP; i++) {
            if (primeP % i === 0) {
                isPrime = false;
                break;
            }
        }
        if (!isPrime) {
            throw new Error('The number is not prime');
        }
        this._primeNumberP = primeP;
    }
    /**
     * Set the Q prime number for the RSA algorithm
     * @param {string} primeQ - The prime number Q
     * @memberof Crypto
     * @example
     * ```typescript
     * crypto.setPrimeQ(19)
     * ```
     * */
    setPrimeQ(primeQ) {
        let isPrime = true;
        for (let i = 2; i < primeQ; i++) {
            if (primeQ % i === 0) {
                isPrime = false;
                break;
            }
        }
        if (!isPrime) {
            throw new Error('The number is not prime');
        }
        this._primeNumberQ = primeQ;
    }
}
const crypto = new Crypto();
exports.default = crypto;
