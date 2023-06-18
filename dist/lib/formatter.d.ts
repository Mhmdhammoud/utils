declare class Formatter {
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
    toUpperFirst: (_: string | number, withSpacing?: boolean) => string;
    /**
     * @remarks normalizes input to supported path and file name format.
     * Changes camelCase strings to kebab-case, replaces spaces with dash and keeps underscores. *
     * @param str - String needed to be modified
     * @returns formatted string
     */
    camelToKebab: (str: string) => string;
    /**
     * @remarks obfuscates email address
     * @param email - email address to be obfuscated
     * @returns obfuscated email address
     * @example
     * ```typescript
     * formatter.obfuscate('johndoe@email.com') // => jo*****@gmail.com
     * ```
     * */
    obfuscate: (email: string) => string;
    /**
     * @remarks Generates a slug from a given string
     * @param title - string to be converted to slug
     * @returns slug
     * @example
     * ```typescript
     * formatter.slugify('Hello World') // => hello-world
     * ```
     * */
    slugify: (title: string) => string;
}
declare const formatter: Formatter;
export default formatter;
