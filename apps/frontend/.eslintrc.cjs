const preset = require('@pramana/config/eslint-preset');

module.exports = {
  ...preset,
  overrides: [
    ...(preset.overrides ?? []),
    {
      // The preset exempts src/api; in the merged app each portal owns an api/ folder.
      files: ['src/portals/*/api/**/*.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
};
