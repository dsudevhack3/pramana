/**
 * Shared lint rules. The `no-restricted-syntax` block is where the design
 * system stops being a document and becomes a build gate: raw colours, raw
 * radii, raw durations and scattered fetch() calls fail CI.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh', 'jsx-a11y'],
  settings: { react: { version: 'detect' } },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // SS10: no app defines its own colour, radius, shadow or duration value.
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
        message:
          'Raw hex colour. Use a token from packages/config/tokens.css via the Tailwind preset.',
      },
      {
        selector: "Literal[value=/^\\s*\\d+(px|ms)\\s*$/]",
        message:
          'Raw px/ms value. Use a spacing, radius or duration token instead.',
      },
      {
        selector: "CallExpression[callee.name='fetch']",
        message:
          'SS10: network calls are isolated behind the app api/client.ts. Do not call fetch() from a component.',
      },
    ],

    // SS8: colour is never the sole carrier of meaning; every status pairs
    // colour with an icon AND a word. Enforced in review, aided here.
    'jsx-a11y/no-autofocus': 'off',
  },
  overrides: [
    {
      files: ['src/api/**/*.ts', 'packages/api-client/**/*.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
};
