declare class Crypto {
    private _primeNumberP;
    private _primeNumberQ;
    private _phiN;
    private _moduloDenominator;
    /**
     *
     * @param number - The number to check if prime
     * @returns The boolean answer of prime checking operation
     * @example
     * ```typescript
     * this._isPrime(5)
     * ```
     * */
    private _isPrime;
    /**
     * Set the P prime number for the RSA algorithm
     * @param primeP - The prime number P of type string
     * @returns void
     * @example
     * ```typescript
     * crypto.setPrimeP(17)
     * ```
     * */
    setPrimeP(primeP: number): void;
    /**
     * Set the Q prime number for the RSA algorithm
     * @param primeQ - The prime number Q of type string
     * @returns void
     * @example
     * ```typescript
     * crypto.setPrimeQ(19)
     * ```
     * */
    setPrimeQ(primeQ: number): void;
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
    private _modularExponentiation;
    /**
     *
     * @param temporaryVarriableOne - The number one
     * @param temporaryVarriableTwo- The  number two (phi n)
     * @returns The boolean answer of relatively prime checking operation with phi n
     * @example
     * ```typescript
     * this._areRelativelyPrime(5,9)
     * ```
     * */
    private _areRelativelyPrime;
    /**
     *
     * @returns The public and private key number which is a random number generated to match conditions set by RSA algorithm
     * @example
     * ```typescript
     * crypto.generateKeys()
     * ```
     * */
    generateKeys: () => Record<'publicKey' | 'privateKey', number>;
    /**
     *
     * @param publicKey - The public key number
     * @returns The private key number which is the modulus inverse with repect to modulo denominator
     * @example
     * ```typescript
     * crypto.generatePrivateKey(5)
     * ```
     * */
    private _generatePrivateKey;
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
    encrypt: (message: string | number | Record<any, any>, publicKey: number) => number[];
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
    decrypt: (encryptedMessage: number[], privateKey: number) => string;
}
declare const crypto: Crypto;
export default crypto;
