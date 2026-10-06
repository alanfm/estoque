import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['public/build/**', 'node_modules/**', 'vendor/**', 'storage/app/inventory-portability/**', 'storage/app/inventory-distribution/**'] },
  js.configs.recommended,
  { files: ['scripts/*.mjs'], languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks }, rules: hooks.configs.recommended.rules },
);
