/*
	 Author : Mhmd Hammoud
	 Date : 2023-06-17
	 Description : String manipulation
	 Version : 1.0
*/
class Formatter {
	/**
	 * @remarks Normalizes input by removing underscores and hyphens and capitalizing the first letter of the sentence.
	 * @param stringToBeChanged - to be formatted without underscores and hyphens
	 * @param withWhiteSpacing - Determines if white spacing is needed in the final string or not (default: true)
	 * @returns string
	 * @example
	 * ```typescript
	 * formatter.toUpperFirst('hello world')
	 * // => 'Hello-World'
	 * ```
	 * */
	toUpperFirst = (_: string | number, withSpacing = true) => {
		if (typeof _ !== 'string') throw new Error('Provide a valid string')
		if (withSpacing) {
			return _.split(' ')
				.map((val: string) => val.charAt(0).toUpperCase() + val.slice(1))
				.join(' ')
				.replace(/ /g, '-')
				.replace(/\//g, '-')
				.replace(/\./g, '')
		} else {
			return _.split(' ')
				.map((val: string) => val.charAt(0).toUpperCase() + val.slice(1))
				.join(' ')
				.replace(/\//g, '-')
				.replace(/\./g, '')
		}
	}

	/**
	 * @remarks normalizes input to supported path and file name format.
	 * Changes camelCase strings to kebab-case, replaces spaces with dash and keeps underscores. *
	 * @param str - String needed to be modified
	 * @returns formatted string
	 */
	camelToKebab = (str: string) => {
		const STRING_DASHERIZE_REGEXP = /\s/g
		const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g
		return str
			.replace(STRING_DECAMELIZE_REGEXP, '$1-$2')
			.toLowerCase()
			.replace(STRING_DASHERIZE_REGEXP, '-')
	}

	/**
	 * @remarks obfuscates email address
	 * @param email - email address to be obfuscated
	 * @returns obfuscated email address
	 * @example
	 * ```typescript
	 * formatter.obfuscate('johndoe@email.com') // => jo*****@gmail.com
	 * ```
	 * */
	obfuscate = (email: string) => {
		if (typeof email !== 'string') throw new Error('Provide a valid string')
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email))
			throw new Error('Provide a valid email address')
		const separatorIndex = email.indexOf('@')
		if (separatorIndex < 3) {
			// 'ab@gmail.com' -> '**@gmail.com'
			return (
				email.slice(0, separatorIndex).replace(/./g, '*') +
				email.slice(separatorIndex)
			)
		}
		// 'test42@gmail.com' -> 'te****@gmail.com'
		return (
			email.slice(0, 2) +
			email.slice(2, separatorIndex).replace(/./g, '*') +
			email.slice(separatorIndex)
		)
	}

	/**
	 * @remarks Generates a slug from a given string
	 * @param title - string to be converted to slug
	 * @returns slug
	 * @example
	 * ```typescript
	 * formatter.slugify('Hello World') // => hello-world
	 * ```
	 * */
	slugify = (title: string) => {
		if (typeof title !== 'string') throw new Error('Provide a valid string')
		return title
			.replace(/ /g, '-')
			.replace(/%/g, '-')
			.replace(/#/g, '-')
			.replace(/\?/g, '-')
			.replace(/,/g, '-')
			.replace(/\//g, '-')
			.replace(/\\/g, '-')
			.replace(/\./g, '')
			.replace(/'/g, '')
			.replace(/"/g, '')
			.replace(/\+/g, '-')
			.replace(/\*/g, '-')
			.replace(/\^/g, '-')
			.replace(/@/g, '-')
			.replace(/;/g, '-')
			.replace(/:/g, '-')
			.replace(/!/g, '-')
			.replace(/&/g, '-')
			.replace(/\$/g, '-')
			.replace(/\(/g, '-')
			.replace(/\)/g, '-')
			.trim()
			.toLowerCase()
	}
}

const formatter = new Formatter()
export default formatter
