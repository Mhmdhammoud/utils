declare class Crypto {
    private modulus;
    private _primeNumberP;
    private _primeNumberQ;
    private _moduloDenominator;
    setPrimeP(primeP: number): void;
    setPrimeQ(primeQ: number): void;
    private _modularExponentiation;
    encrypt: (message: string, publicKeyExponent: number) => number[];
    decrypt: (ciphertext: number[], privateKeyExponent: number) => string;
}
declare const crypto: Crypto;
export default crypto;
