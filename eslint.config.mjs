import { FlatCompat } from "@eslint/eslintrc";
import eslint from '@eslint/js';
import pluginLingui from 'eslint-plugin-lingui'
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import reactNativeA11yPlugin from 'eslint-plugin-react-native-a11y';
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
      'react-native-a11y': reactNativeA11yPlugin,
      "simple-import-sort": simpleImportSort,
      "react-compiler": reactCompilerPlugin,
      'react-hooks': reactHooksPlugin,
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
      //These should all be quick followed after eslint v9 upgrade
      'no-async-promise-executor': 'off',
      'no-case-declarations': 'off',
      'no-control-regex': 'off',
      'no-dupe-else-if': 'off',
      'no-empty': 'off',
      'no-empty-pattern': 'off',
      'no-irregular-whitespace': 'off',
      'no-prototype-builtins': 'off',
      'no-sparse-arrays': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-useless-escape': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      '@typescript-eslint/ban-ts-comment': "off",
      "@typescript-eslint/no-empty-object-type": ["error", { "allowObjectTypes": "always" }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-expressions':'off',
      "@typescript-eslint/no-require-imports": "off",
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_'  }],
      '@typescript-eslint/no-wrapper-object-types': 'off'
    },
    settings: {
      react: {
        version: 'detect',
      },
      componentWrapperFunctions: ['observer'],
    },
    ignores: [
      '**/__mocks__/*.ts',
      '**/src/third-party',
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