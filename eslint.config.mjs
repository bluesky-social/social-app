// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
// @ts-expect-error no types
import reactNative from 'eslint-plugin-react-native'
// @ts-expect-error no types
import reactNativeA11y from 'eslint-plugin-react-native-a11y'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import importX from 'eslint-plugin-import-x'
import lingui from 'eslint-plugin-lingui'
import reactCompiler from 'eslint-plugin-react-compiler'
import bskyInternal from 'eslint-plugin-bsky-internal'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'

export default defineConfig(
  /**
   * Global ignores
   */
  {
    ignores: [
      '**/__mocks__/*.ts',
      'src/platform/polyfills.ts',
      'src/third-party/**',
      'ios/**',
      'android/**',
      'coverage/**',
      '*.lock',
      '.husky/**',
      'patches/**',
      '*.html',
      'bskyweb/**',
      'bskyembed/**',
      'src/locale/locales/_build/**',
      'src/locale/locales/**/*.js',
      '*.e2e.ts',
      '*.e2e.tsx',
      'eslint.config.mjs',
    ],
  },

  /**
   * Base configurations
   */
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
  // @ts-expect-error https://github.com/un-ts/eslint-plugin-import-x/issues/439
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  importX.flatConfigs['react-native'],

  /**
   * Main configuration for all JS/TS/JSX/TSX files
   */
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-native': reactNative,
      'react-native-a11y': reactNativeA11y,
      'simple-import-sort': simpleImportSort,
      lingui,
      'react-compiler': reactCompiler,
      'bsky-internal': bskyInternal,
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
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      componentWrapperFunctions: ['observer'],
    },
    rules: {
      /**
       * Custom rules
       */
      'bsky-internal/avoid-unwrapped-text': [
        'error',
        {
          impliedTextComponents: [
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
            'P',
            'Admonition',
            'Admonition.Admonition',
            'Toast.Action',
            'AgeAssuranceAdmonition',
            'Span',
            'StackedButton',
          ],
          impliedTextProps: [],
          suggestedTextWrappers: {
            Button: 'ButtonText',
            'ToggleButton.Button': 'ToggleButton.ButtonText',
            'SegmentedControl.Item': 'SegmentedControl.ItemText',
          },
        },
      ],
      'bsky-internal/use-exact-imports': 'error',
      'bsky-internal/use-typed-gates': 'error',
      'bsky-internal/use-prefixed-imports': 'error',

      /**
       * React & React Native
       */
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react-native/no-inline-styles': 'off',
      ...reactNativeA11y.configs.all.rules,
      'react-compiler/react-compiler': 'warn',
      // TODO: Fix these and set to error
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',

      /**
       * Import sorting
       */
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports.
            ['^\\u0000'],
            // Node.js builtins prefixed with `node:`.
            ['^node:'],
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            // React/React Native prioritized, followed by expo
            // Followed by all packages excluding unprefixed relative ones
            [
              '^(react\\/(.*)$)|^(react$)|^(react-native(.*)$)',
              '^(expo(.*)$)|^(expo$)',
              '^(?!(?:alf|components|lib|locale|logger|platform|screens|state|view)(?:$|\\/))@?\\w',
            ],
            // Relative imports.
            // Ideally, anything that starts with a dot or #
            // due to unprefixed relative imports being used, we whitelist the relative paths we use
            // (?:$|\\/) matches end of string or /
            [
              '^(?:#\\/)?(?:lib|state|logger|platform|locale)(?:$|\\/)',
              '^(?:#\\/)?view(?:$|\\/)',
              '^(?:#\\/)?screens(?:$|\\/)',
              '^(?:#\\/)?alf(?:$|\\/)',
              '^(?:#\\/)?components(?:$|\\/)',
              '^#\\/',
              '^\\.',
            ],
            // anything else - hopefully we don't have any of these
            ['^'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      /**
       * Import linting
       */
      'import-x/consistent-type-specifier-style': ['warn', 'prefer-inline'],
      'import-x/no-unresolved': ['error', {
        /*
         * The `postinstall` hook runs `compile-if-needed` locally, but not in
         * CI. For CI-sake, ignore this.
         */
        ignore: ['^#\/locale\/locales\/.+\/messages'],
      }],

      /**
       * TypeScript-specific rules
       */
      'no-unused-vars': 'off', // off, we use TS-specific rule below
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_.+',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {prefer: 'type-imports', fixStyle: 'inline-type-imports'},
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowTernary: true,
      }],
      /**
       * Maintain previous behavior - these are stricter in typescript-eslint
       * v8 `warn` ones are probably worth fixing. `off` ones are a bit too
       * nit-picky
       */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-duplicate-type-constituents': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      /**
       * Turn off rules that we haven't enforced thus far
       */
      'no-empty-pattern': 'off',
      'no-async-promise-executor': 'off',
      'no-constant-binary-expression': 'warn',
      'prefer-const': 'off',
      'no-empty': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-prototype-builtins': 'off',
      'no-var': 'off',
      'prefer-rest-params': 'off',
      'no-case-declarations': 'off',
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      'no-sparse-arrays': 'off',
      'no-fallthrough': 'off',
      'no-control-regex': 'off',
    },
  },

  /**
   * Test files configuration
   */
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      }
    },
  },
)
