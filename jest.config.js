/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	coverageDirectory: 'coverage',
	coverageProvider: 'v8',
	collectCoverageFrom: ['src/**/*.ts', '!test/**/*.ts'],
	transform: {
		'^.+\\.(ts)$': 'ts-jest',
	},
	transformIgnorePatterns: [],
	testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
}
