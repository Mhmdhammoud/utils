"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
     Author : Omar Sawwas
     Date : 2023-06-17
     Description : RSA algorithm
     Version : 1.0
*/
class Crypto {
    constructor() {
        // Default variables
        this._primeNumberP = 17;
        this._primeNumberQ = 19;
        this._moduloDenominator = this._primeNumberP * this._primeNumberQ;
        /**
         *
         * @param base - The base number of type number
         * @param exponent - The exponent number of type number
         * @returns The modular exponentiation of the base and the exponent
         * @example
         * ```typescript
         * this.modularExponentiation(2, 3)
         * ```
         * */
        this._modularExponentiation = (base, exponent) => {
            if (isNaN(base) || isNaN(exponent)) {
                throw new Error('Provide a valid number');
            }
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
         * @param message - The message to encrypt of type string|number|Record
         * @param publicKey - The public key to encrypt the message with of type number
         * @returns The encrypted message of type number[]
         * @example
         * ```typescript
         * crypto.encrypt('Hello World', 7)
         * ```
         * */
        this.encrypt = (message, publicKey) => {
            if (isNaN(publicKey)) {
                throw new Error('Public key should be a number');
            }
            if (typeof message === 'number') {
                message = message.toString();
            }
            if (typeof message === 'object') {
                message = JSON.stringify(message);
            }
            const encryptedMessage = [];
            for (let i = 0; i < message.length; i++) {
                const a = message.charCodeAt(i);
                encryptedMessage.push(this._modularExponentiation(a, publicKey));
            }
            return encryptedMessage;
        };
        /**
         * Decrypt the message using the private key
         * @param encryptedMessage - The encryptedMessage to decrypt of type number[]
         * @param privateKey - The private key to decrypt the message with of type number
         * @returns The decrypted message of type string
         * @example
         * ```typescript
         * crypto.decrypt([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100], 23)
         * ```
         * */
        this.decrypt = (encryptedMessage, privateKey) => {
            if (isNaN(privateKey)) {
                throw new Error('Private key should be a number');
            }
            if (!Array.isArray(encryptedMessage)) {
                throw new Error('Encrypted message should be an array');
            }
            const allValidNumbers = encryptedMessage.every((number) => !isNaN(number));
            if (!allValidNumbers) {
                throw new Error('Encrypted message should be an array of numbers');
            }
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
     * @param primeP - The prime number P of type string
     * @returns void
     * @example
     * ```typescript
     * crypto.setPrimeP(17)
     * ```
     * */
    setPrimeP(primeP) {
        if (isNaN(primeP)) {
            throw new Error('Provide a valid number');
        }
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
     * @param primeQ - The prime number Q of type string
     * @returns void
     * @example
     * ```typescript
     * crypto.setPrimeQ(19)
     * ```
     * */
    setPrimeQ(primeQ) {
        if (isNaN(primeQ)) {
            throw new Error('Provide a valid number');
        }
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
