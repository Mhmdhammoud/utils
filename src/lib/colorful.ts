/*
	 Author : Mhmd Hammoud https://github.com/mhmdhammoud
	 Date : 2024-01-20
	 Description : Color adapter
	 Version : 1.0
*/
class Colorful {
	/**
	 * @remarks
	 *  Receives a color in RGB format and returns it in HEX format
	 * @param color - Color in RGB format
	 * @example
	 * ```ts
	 * const color = 'rgb(255, 255, 255)';
	 * const hexColor = rgbToHex(color);
	 * console.log(hexColor) // #ffffff
	 * ```
	 *
	 * @returns Color in HEX format string
	 */
	rgbToHex = (color: string): string => {
		const componentToHex = (c: any) => {
			const hex = c.toString(16)
			return hex.length == 1 ? '0' + hex : hex
		}

		const rgbaMatch = color.match(
			/rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*((\d+\.)?\d+)\)/
		)
		const rgbMatch = color.match(/rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/)

		let redColor, greenColor, blueColor

		if (rgbaMatch) {
			redColor = parseInt(rgbaMatch[1], 10)
			greenColor = parseInt(rgbaMatch[2], 10)
			blueColor = parseInt(rgbaMatch[3], 10)
		} else if (rgbMatch) {
			redColor = parseInt(rgbMatch[1], 10)
			greenColor = parseInt(rgbMatch[2], 10)
			blueColor = parseInt(rgbMatch[3], 10)
		} else {
			// Both patterns failed to match
			throw new Error(
				`Invalid color format '${color}'. Please provide a valid RGB or RGBA color.`
			)
		}

		const hexColor =
			'#' +
			componentToHex(redColor) +
			componentToHex(greenColor) +
			componentToHex(blueColor)

		return hexColor
	}

	/**
	 * @remarks
	 *  Receives a color in HEX format and returns it in RGB format
	 * @param hexColor - Color in HEX format
	 * @example
	 * ```ts
	 * const hexColor = '#ffffff';
	 * const rgbColor = hexToRgb(hexColor);
	 * console.log(rgbColor) // 'rgb(255, 255, 255)'
	 * ```
	 *
	 * @returns Color in RGB format string
	 */
	hexToRgb = (hexColor: string): string => {
		const hex = hexColor.replace(/^#/, '')
		const bigint = parseInt(hex, 16)
		const red = (bigint >> 16) & 255
		const green = (bigint >> 8) & 255
		const blue = bigint & 255
		return `rgb(${red}, ${green}, ${blue})`
	}

	/**
	 * @remarks
	 *  Checks whether a given HEX color is light or dark
	 * @param hexColor - Color in HEX format
	 * @example
	 * ```ts
	 * const hexColor = '#ffffff';
	 * const isLight = isLightColor(hexColor);
	 * console.log(isLight); // true or false
	 * ```
	 *
	 * @returns True if the color is light, false if it is dark
	 */
	isLightColor = (color: string): boolean => {
		// Remove spaces
		const trimmedColor = color.replace(/\s/g, '')

		// Check if the color is in RGBA format
		const rgbaMatch = trimmedColor.match(
			/^rgba\((\d+),(\d+),(\d+),(\d+(\.\d+)?)\)$/
		)

		if (rgbaMatch) {
			// Extract RGB components from RGBA
			const r = parseInt(rgbaMatch[1], 10)
			const g = parseInt(rgbaMatch[2], 10)
			const b = parseInt(rgbaMatch[3], 10)

			// Calculate the relative luminance without considering alpha
			const luminance = 0.299 * r + 0.587 * g + 0.114 * b

			// You can adjust the threshold to your preference
			const threshold = 128

			// Determine whether the color is light or dark
			return luminance > threshold
		}

		// Check if the color is in RGB format
		const rgbMatch = trimmedColor.match(/^rgb\((\d+),(\d+),(\d+)\)$/)

		if (rgbMatch) {
			// Extract RGB components from RGB
			const r = parseInt(rgbMatch[1], 10)
			const g = parseInt(rgbMatch[2], 10)
			const b = parseInt(rgbMatch[3], 10)

			// Calculate the relative luminance of the color
			// This formula gives more weight to green as the human eye is more sensitive to it
			const luminance = 0.299 * r + 0.587 * g + 0.114 * b

			// You can adjust the threshold to your preference
			const threshold = 128

			// Determine whether the color is light or dark
			return luminance > threshold
		}

		// Remove the '#' character if present
		const hexColor = trimmedColor.replace('#', '')

		// Check if the hex color has a valid format
		if (!/^[0-9A-Fa-f]{6}$/.test(hexColor)) {
			throw new Error(
				`Invalid color format '${color}'. Please provide a valid HEX, RGB, or RGBA color.`
			)
		}

		// Convert the hex color to RGB components
		const r = parseInt(hexColor.slice(0, 2), 16)
		const g = parseInt(hexColor.slice(2, 4), 16)
		const b = parseInt(hexColor.slice(4, 6), 16)

		// Calculate the relative luminance of the color
		// This formula gives more weight to green as the human eye is more sensitive to it
		const luminance = 0.299 * r + 0.587 * g + 0.114 * b

		// You can adjust the threshold to your preference
		const threshold = 128

		// Determine whether the color is light or dark
		return luminance > threshold
	}
}

const colorful = new Colorful()

export default colorful
