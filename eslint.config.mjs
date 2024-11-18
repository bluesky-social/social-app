import { FlatCompat } from "@eslint/eslintrc";
import eslint from '@eslint/js';
import pluginLingui from 'eslint-plugin-lingui'
import reactPlugin from 'eslint-plugin-react';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import simpleImportSort from "eslint-plugin-simple-import-sort";
import path from "path";
import tseslint from 'typescript-eslint';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
});

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  pluginLingui.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    // ...compat.plugins("bsky-internal"),
    plugins: {
      "simple-import-sort": simpleImportSort,
      "react-compiler": reactCompilerPlugin,
    },
    rules: {
      'prettier/prettier': 0,
      'react/no-unescaped-entities': 0,
      'react-native/no-inline-styles': 0,
      // 'bsky-internal/avoid-unwrapped-text': [
      //   'error',
      //   {
      //     impliedTextComponents: [
      //       'H1',
      //       'H2',
      //       'H3',
      //       'H4',
      //       'H5',
      //       'H6',
      //       'P',
      //       'Admonition',
      //     ],
      //     impliedTextProps: [],
      //     suggestedTextWrappers: {
      //       Button: 'ButtonText',
      //       'ToggleButton.Button': 'ToggleButton.ButtonText',
      //     },
      //   },
      // ],
      // 'bsky-internal/use-exact-imports': 'error',
      // 'bsky-internal/use-typed-gates': 'error',
      // 'bsky-internal/use-prefixed-imports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            [
              '^(react\\/(.*)$)|^(react$)|^(react-native(.*)$)',
              '^(expo(.*)$)|^(expo$)',
              '^(?!(?:alf|components|lib|locale|logger|platform|screens|state|view)(?:$|\\/))@?\\w',
            ],
            [
              '^(?:#\\/)?(?:lib|state|logger|platform|locale)(?:$|\\/)',
              '^(?:#\\/)?view(?:$|\\/)',
              '^(?:#\\/)?screens(?:$|\\/)',
              '^(?:#\\/)?alf(?:$|\\/)',
              '^(?:#\\/)?components(?:$|\\/)',
              '^#\\/',
              '^\\.',
            ],
            ['^'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'react-compiler/react-compiler': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@atproto/api',
              importNames: ['moderatePost'],
              message:
                'Please use `moderatePost_wrapped` from `#/lib/moderatePost_wrapped` instead.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
      componentWrapperFunctions: ['observer'],
    },
    ignores: [
      '**/__mocks__/*.ts',
      'src/platform/polyfills.ts',
      'src/third-party',
      'ios',
      'android',
      'coverage',
      '*.lock',
      '.husky',
      'patches',
      'bskyweb',
      '*.html',
      'bskyweb',
      'src/locale/locales/_build/',
      'src/locale/locales/**/*.js',
    ],
  });