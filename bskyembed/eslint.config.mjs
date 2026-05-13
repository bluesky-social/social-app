// @ts-check
import js from '@eslint/js'
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { importX } from 'eslint-plugin-import-x'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'


export default defineConfig(
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'src/lexicons/**'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules with type checking
  tseslint.configs.recommendedTypeChecked,

  // import-x
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  // Main configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tsParser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'no-else-return': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_.+',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      'import-x/consistent-type-specifier-style': ['warn', 'prefer-inline'],
    },
  },
)
