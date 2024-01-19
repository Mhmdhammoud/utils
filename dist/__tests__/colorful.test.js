"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
describe('Colorful Class', () => {
    describe('rgbToHex method', () => {
        it('should convert RGB to HEX', () => {
            const rgbColor = 'rgb(255, 255, 255)';
            const hexColor = lib_1.Colorful.rgbToHex(rgbColor);
            expect(hexColor).toBe('#ffffff');
        });
        it('should convert RGBA to HEX', () => {
            const rgbaColor = 'rgba(255, 0, 0, 0.5)';
            const hexColor = lib_1.Colorful.rgbToHex(rgbaColor);
            expect(hexColor).toBe('#ff0000');
        });
        it('should throw an error for invalid color format', () => {
            const invalidColor = 'invalidColor';
            expect(() => lib_1.Colorful.rgbToHex(invalidColor)).toThrowError(`Invalid color format '${invalidColor}'. Please provide a valid RGB or RGBA color.`);
        });
    });
    describe('hexToRgb method', () => {
        it('should convert HEX to RGB', () => {
            const hexColor = '#ffffff';
            const rgbColor = lib_1.Colorful.hexToRgb(hexColor);
            expect(rgbColor).toBe('rgb(255, 255, 255)');
        });
    });
    describe('isLightColor method', () => {
        it('should return true for a light color (HEX format)', () => {
            const lightHexColor = '#f0f0f0';
            const isLight = lib_1.Colorful.isLightColor(lightHexColor);
            expect(isLight).toBe(true);
        });
        it('should return false for a dark color (HEX format)', () => {
            const darkHexColor = '#333333';
            const isLight = lib_1.Colorful.isLightColor(darkHexColor);
            expect(isLight).toBe(false);
        });
        it('should return true for a light color (RGBA format)', () => {
            const lightRgbaColor = 'rgba(255, 255, 255, 0.5)';
            const isLight = lib_1.Colorful.isLightColor(lightRgbaColor);
            expect(isLight).toBe(true);
        });
        it('should return false for a dark color (RGBA format)', () => {
            const darkRgbaColor = 'rgba(0, 0, 0, 0.8)';
            const isLight = lib_1.Colorful.isLightColor(darkRgbaColor);
            expect(isLight).toBe(false);
        });
        it('should return true for a light color (RGB format)', () => {
            const lightRgbColor = 'rgb(200, 220, 255)';
            const isLight = lib_1.Colorful.isLightColor(lightRgbColor);
            expect(isLight).toBe(true);
        });
        it('should return false for a dark color (RGB format)', () => {
            const darkRgbColor = 'rgb(10, 20, 30)';
            const isLight = lib_1.Colorful.isLightColor(darkRgbColor);
            expect(isLight).toBe(false);
        });
        it('should throw an error for an invalid color format', () => {
            const invalidColor = 'invalid-color';
            expect(() => lib_1.Colorful.isLightColor(invalidColor)).toThrowError("Invalid color format 'invalid-color'. Please provide a valid HEX, RGB, or RGBA color.");
        });
    });
});
