declare class Colorful {
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
    rgbToHex: (color: string) => string;
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
    hexToRgb: (hexColor: string) => string;
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
    isLightColor: (color: string) => boolean;
}
declare const colorful: Colorful;
export default colorful;
