class Crypto {
	private modulus: number
	// 2 predefined varriables for rsa algorithm
	private _primeNumberP = 17
	private _primeNumberQ = 19
	// Calculated varriables
	private _moduloDenominator = this._primeNumberP * this._primeNumberQ
	// this function will be used :
	// Cipher = (message)^e % n
	// Message = (cipher)^d % n
	public setPrimeP(primeP: number) {
		this._primeNumberP = primeP
	}
	public setPrimeQ(primeQ: number) {
		this._primeNumberQ = primeQ
	}

	private _modularExponentiation = (base: number, exponent: number) => {
		if (this._moduloDenominator === 1) {
			return 0
		}
		let result = 1
		base = base % this._moduloDenominator
		while (exponent > 0) {
			if (exponent % 2 === 1) {
				result = (result * base) % this._moduloDenominator
			}
			exponent = Math.floor(exponent / 2)
			base = (base * base) % this._moduloDenominator
		}
		return result
	}

	public encrypt = (message: string, publicKeyExponent: number): number[] => {
		const b: number[] = []
		for (let i = 0; i < message.length; i++) {
			const a = message.charCodeAt(i)
			b.push(this._modularExponentiation(a, publicKeyExponent))
		}
		return b
	}

	public decrypt = (
		ciphertext: number[],
		privateKeyExponent: number
	): string => {
		const b: number[] = []
		for (let i = 0; i < ciphertext.length; i++) {
			const a = ciphertext[i]
			b.push(this._modularExponentiation(a, privateKeyExponent))
		}
		let finalString = ''
		for (let i = 0; i < b.length; i++) {
			finalString += String.fromCharCode(b[i])
		}
		return finalString
	}
}
const crypto = new Crypto()
export default crypto
