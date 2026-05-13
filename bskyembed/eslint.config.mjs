// @ts-check
import js from '@eslint/js'
<<<<<<< HEAD
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import {importX} from 'eslint-plugin-import-x'
=======
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { importX } from 'eslint-plugin-import-x'
>>>>>>> 7cb3499c2 (use pnpm, update eslint/typescript)
import globals from 'globals'

export default defineConfig(
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**'],
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
    },
  },
)
