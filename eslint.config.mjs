// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import {defineConfig} from 'eslint/config'
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
      'ios/**',
      'android/**',
      'coverage/**',
      '*.lock',
      '.husky/**',
      'patches/**',
      '*.html',
      // Eurosky fork: static iframe player scripts (browser globals like YT /
      // onYouTubeIframeAPIReady, not app code). Mirrors the bskyweb/** ignore.
      'web/iframe/**',
      'bskyweb/**',
      'bskyembed/**',
      'bskyogcard/**',
      // Eurosky fork: the OAuth client-assertion worker is a separate sub-project
      // (Cloudflare Worker + Bunny Edge Scripting / Deno) with its own runtime,
      // types, and URL imports - not app code. It has its own tsconfig/lint.
      'oauth-worker/**',
      // Eurosky fork: the Plausible analytics proxy is a Bunny Edge Script
      // (Deno runtime + URL imports), not app code - same rationale as above.
      'plausible-worker/**',
      'src/locale/locales/_build/**',
      'src/locale/locales/**/*.js',
      '*.e2e.ts',
      '*.e2e.tsx',
      'eslint.config.mjs',
      '.jscodeshift/**',
    ],
  },

  /**
   * Base configurations
   */
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
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
      // @ts-expect-error - not sure why
      lingui,
      'react-compiler': reactCompiler,
      'bsky-internal': bskyInternal,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: tsParser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
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
      'bsky-internal/use-prefixed-imports': 'error',
      'bsky-internal/lingui-msg-rule': 'error',

      /**
       * React & React Native
       */
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/hook-use-state': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react-native/no-inline-styles': 'off',
      ...reactNativeA11y.configs.all.rules,
      'react-compiler/react-compiler': 'warn',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/immutability': 'error',

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
      'import-x/no-unresolved': [
        'error',
        {
          /*
           * The `postinstall` hook runs `compile-if-needed` locally, but not in
           * CI. For CI-sake, ignore this.
           */
          ignore: ['^#\/locale\/locales\/.+\/messages'],
        },
      ],
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          whitelist: [
            // test files only
            '@jest/globals',
            // we only use a really simple util from this, and we know it will be present
            'expo-modules-core',
            // this is a dep for @atproto/api, but we absolutely need them in sync, so just
            // rely on the transient version
            '@atproto/common-web',
          ],
        },
      ],
      'import-x/no-nodejs-modules': 'error',

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
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowTernary: true,
        },
      ],
      /**
       * Maintain previous behavior via eslint-suppressions.json - these are
       * stricter in typescript-eslint v8. `off` ones are a bit too nit-picky.
       */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-duplicate-type-constituents': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      '@typescript-eslint/await-thenable': 'error',

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['React', 'default'],
              message:
                'React is already in the global type namespace. Use named imports for runtime modules.',
            },
          ],
        },
      ],

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
   * bskyogcard, dev-env - server-side, Node.js imports are fine
   */
  {
    files: ['bskyogcard/**/*.{js,jsx,ts,tsx}', 'dev-env/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'import-x/no-nodejs-modules': 'off',
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
      },
    },
  },
)
