// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/alerts.ts'],
    rules: {
      // expo-notifications re-exports these enums. TypeScript resolves them; this rule does not.
      'import/namespace': 'off',
    },
  },
]);
