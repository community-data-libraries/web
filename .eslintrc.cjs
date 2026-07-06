/* eslint-env node */
module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/'],
  env: { browser: true, es2022: true, node: true },
  globals: {
    L: 'readonly',
    ApexCharts: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: false,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'astro'],
  overrides: [
    {
      files: ['**/*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      rules: {
        'prettier/prettier': 'off'
      }
    },
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
