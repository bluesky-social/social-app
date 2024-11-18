import eslint from '@eslint/js';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { 'simple-import-sort': simpleImportSortPlugin },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'no-else-return': 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      }
    },
  },
)