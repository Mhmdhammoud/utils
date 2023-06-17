module.exports = {
	plugins: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-tsdoc'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	rules: {
		'tsdoc/syntax': 'warn',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{
				vars: 'all',
				args: 'after-used',
				ignoreRestSiblings: true,
			},
		],
		'@typescript-eslint/no-explicit-any': 'off',
		'no-async-promise-executor': 'off',
	},
	root: true,
}
