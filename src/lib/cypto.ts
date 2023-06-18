/*
	 Author : Omar Sawwas
	 Date : 2023-06-17
	 Description : RSA algorithm
	 Version : 1.0
*/
class Crypto {
	// Default variables
	private _primeNumberP = 17
	private _primeNumberQ = 19
	private _phiN = (this._primeNumberP - 1) * (this._primeNumberQ - 1)
	private _moduloDenominator = this._primeNumberP * this._primeNumberQ

	/**
	 *
	 * @param number - The number to check if prime
	 * @returns The boolean answer of prime checking operation
	 * @example
	 * ```typescript
	 * this._isPrime(5)
	 * ```
	 * */

	private _isPrime = (number: number): boolean => {
		if (number <= 1) {
			return false
		}

		if (number <= 3) {
			return true
		}

		if (number % 2 === 0 || number % 3 === 0) {
			return false
		}

		for (let i = 5; i * i <= number; i += 6) {
			if (number % i === 0 || number % (i + 2) === 0) {
				return false
			}
		}

		return true
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

	public setPrimeP(primeP: number) {
		if (isNaN(primeP) || primeP === 0) {
			throw new Error('Provide a valid number')
		}

		if (!this._isPrime(primeP)) {
			throw new Error('The number is not prime')
		}
		this._primeNumberP = primeP
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

	public setPrimeQ(primeQ: number) {
		if (isNaN(primeQ) || primeQ === 0) {
			throw new Error('Provide a valid number')
		}
		if (!this._isPrime(primeQ)) {
			throw new Error('The number is not prime')
		}
		this._primeNumberQ = primeQ
	}

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

	private _modularExponentiation = (base: number, exponent: number) => {
		if (isNaN(base) || isNaN(exponent)) {
			throw new Error('Provide a valid number')
		}
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

	private _areRelativelyPrime = (
		temporaryVarriableOne: number,
		temporaryVarriableTwo: number
	) => {
		while (temporaryVarriableTwo !== 0) {
			const temp = temporaryVarriableTwo
			temporaryVarriableTwo = temporaryVarriableOne % temporaryVarriableTwo
			temporaryVarriableOne = temp
		}
		return temporaryVarriableOne === 1
	}

	/**
	 *
	 * @returns The public and private key number which is a random number generated to match conditions set by RSA algorithm
	 * @example
	 * ```typescript
	 * crypto.generateKeys()
	 * ```
	 * */

	public generateKeys = (): Record<'publicKey' | 'privateKey', number> => {
		const temporaryArray: number[] = []
		for (let i = 2; i < this._phiN; i++) {
			if (this._areRelativelyPrime(i, this._phiN)) {
				temporaryArray.push(i)
			}
		}
		if (temporaryArray.length === 0)
			throw new Error('No public key options found!')
		const randomIndex = Math.floor(Math.random() * temporaryArray.length)
		// return temporaryArray[randomIndex]
		const publicKey = temporaryArray[randomIndex]
		const privateKey = this._generatePrivateKey(publicKey)
		if (privateKey === publicKey) {
			return this.generateKeys()
		}
		return {
			privateKey: publicKey,
			publicKey: privateKey,
		}
	}

	/**
	 *
	 * @param publicKey - The public key number
	 * @returns The private key number which is the modulus inverse with repect to modulo denominator
	 * @example
	 * ```typescript
	 * crypto.generatePrivateKey(5)
	 * ```
	 * */

	private _generatePrivateKey = (publicKey: number): number => {
		if (publicKey <= 1 || isNaN(publicKey)) {
			throw new Error('Public key should be a number greater than 1')
		}

		if (!this._areRelativelyPrime(publicKey, this._phiN)) {
			throw new Error(
				'Public key should be relatively prime with respect to phi N'
			)
		}

		let t1 = 0
		let t2 = 1
		let r1 = this._phiN
		let r2 = publicKey

		while (r2 !== 0) {
			const quotient = Math.floor(r1 / r2)
			const temp1 = t1
			const temp2 = r1

			t1 = t2
			r1 = r2

			t2 = temp1 - quotient * t2
			r2 = temp2 - quotient * r2
		}

		if (r1 > 1) {
			throw new Error('The number does not have a modular inverse.')
		}

		if (t1 < 0) {
			t1 += this._phiN
		}

		return t1
	}

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

	public encrypt = (
		message: string | number | Record<any, any>,
		publicKey: number
	): number[] => {
		if (isNaN(publicKey)) {
			throw new Error('Public key should be a number')
		}
		if (publicKey <= 0) {
			throw new Error(
				'Private key should be a positive number different than 0'
			)
		}
		if (typeof message === 'number') {
			message = message.toString()
		}
		if (typeof message === 'object') {
			message = JSON.stringify(message)
		}
		const encryptedMessage: number[] = []
		for (let i = 0; i < message.length; i++) {
			const a = message.charCodeAt(i)
			encryptedMessage.push(this._modularExponentiation(a, publicKey))
		}
		return encryptedMessage
	}

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
	public decrypt = (encryptedMessage: number[], privateKey: number): string => {
		if (isNaN(privateKey)) {
			throw new Error('Public key should be a number')
		}
		if (privateKey <= 0) {
			throw new Error(
				'Private key should be a positive number different than 0'
			)
		}
		if (!Array.isArray(encryptedMessage)) {
			throw new Error('Encrypted message should be an array')
		}
		const allValidNumbers = encryptedMessage.every((number) => !isNaN(number))
		if (!allValidNumbers) {
			throw new Error('Encrypted message should be an array of numbers')
		}
		const decryptedAsciiMessage: number[] = []
		for (let i = 0; i < encryptedMessage.length; i++) {
			const a = encryptedMessage[i]
			decryptedAsciiMessage.push(this._modularExponentiation(a, privateKey))
		}
		let finalString = ''
		for (let i = 0; i < decryptedAsciiMessage.length; i++) {
			finalString += String.fromCharCode(decryptedAsciiMessage[i])
		}
		return finalString
	}
}
const crypto = new Crypto()
export default crypto
