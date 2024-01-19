"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
describe('Formatter', () => {
    describe('toUpperFirst method', () => {
        it('should format string with - and upper first letter', () => {
            const formattedString = lib_1.Formatter.toUpperFirst('hello world');
            expect(formattedString).toBe('Hello-world');
        });
        it('should format string with spaces and upper first letter of every word', () => {
            const formattedString = lib_1.Formatter.toUpperFirst('hello_world+test');
            expect(formattedString).toBe('Hello-world-test');
        });
        it('should throw an error for non-string input', () => {
            expect(() => lib_1.Formatter.toUpperFirst(123)).toThrowError('Provide a valid string');
        });
    });
    describe('camelToKebab method', () => {
        it('should convert camelCase to kebab-case', () => {
            const kebabString = lib_1.Formatter.camelToKebab('camelCaseString');
            expect(kebabString).toBe('camel-case-string');
        });
        it('should handle spaces and underscores', () => {
            const kebabString = lib_1.Formatter.camelToKebab('hello World_with Spaces');
            expect(kebabString).toBe('hello-world_with-spaces');
        });
        it('should throw an error for non-string input', () => {
            expect(() => lib_1.Formatter.camelToKebab(123)).toThrowError('Invalid input. Please provide a valid string.');
        });
    });
    describe('obfuscate method', () => {
        it('should obfuscate email address', () => {
            const obfuscatedEmail = lib_1.Formatter.obfuscate('johndoe@email.com');
            expect(obfuscatedEmail).toMatch(/^jo.*@.*$/);
        });
        it('should throw an error for non-string input', () => {
            //@ts-ignore
            expect(() => lib_1.Formatter.obfuscate(123)).toThrowError('Provide a valid string');
        });
        it('should throw an error for an invalid email address', () => {
            expect(() => lib_1.Formatter.obfuscate('invalid-email')).toThrowError('Provide a valid email address');
        });
    });
    describe('toUpperTitle method', () => {
        it('should capitalize first letter of each word and remove non-alphanumeric characters', () => {
            const upperTitle = lib_1.Formatter.toUpperTitle('this is34354345a---sentence');
            expect(upperTitle).toBe('This Is A Sentence');
        });
        it('should throw an error for non-string input', () => {
            expect(() => lib_1.Formatter.toUpperTitle(123)).toThrowError('Provide a valid string');
        });
        it('should throw an error for empty string', () => {
            expect(() => lib_1.Formatter.toUpperTitle('')).toThrowError('Provide a valid string');
        });
    });
    describe('slugify method', () => {
        it('should generate a slug from the given string', () => {
            const slug = lib_1.Formatter.slugify('Hello World');
            expect(slug).toBe('hello-world');
        });
        it('should handle special characters and spaces', () => {
            const slug = lib_1.Formatter.slugify('Special Characters % #$ & Space');
            expect(slug).toBe('special-characters-space');
        });
        it('should throw an error for non-string input', () => {
            expect(() => lib_1.Formatter.slugify(123)).toThrowError('Provide a valid string');
        });
    });
});
