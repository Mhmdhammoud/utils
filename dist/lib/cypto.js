"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Crypto {
    constructor() {
        // 2 predefined varriables for rsa algorithm
        this._primeNumberP = 17;
        this._primeNumberQ = 19;
        // Calculated varriables
        this._moduloDenominator = this._primeNumberP * this._primeNumberQ;
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
        this.encrypt = (message, publicKeyExponent) => {
            const b = [];
            for (let i = 0; i < message.length; i++) {
                const a = message.charCodeAt(i);
                b.push(this._modularExponentiation(a, publicKeyExponent));
            }
            return b;
        };
        this.decrypt = (ciphertext, privateKeyExponent) => {
            const b = [];
            for (let i = 0; i < ciphertext.length; i++) {
                const a = ciphertext[i];
                b.push(this._modularExponentiation(a, privateKeyExponent));
            }
            let finalString = '';
            for (let i = 0; i < b.length; i++) {
                finalString += String.fromCharCode(b[i]);
            }
            return finalString;
        };
    }
    // this function will be used :
    // Cipher = (message)^e % n
    // Message = (cipher)^d % n
    setPrimeP(primeP) {
        this._primeNumberP = primeP;
    }
    setPrimeQ(primeQ) {
        this._primeNumberQ = primeQ;
    }
}
const crypto = new Crypto();
exports.default = crypto;
