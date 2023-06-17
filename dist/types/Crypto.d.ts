export declare namespace Crypto {
    class Crypto {
        setPrimeP(primeP: number): void;
        setPrimeQ(primeQ: number): void;
        encrypt: (message: string, publicKey: number) => number[];
        decrypt: (encryptedMessage: number[], privateKey: number) => string;
    }
}
