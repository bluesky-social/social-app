// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'
import reactNativeA11y from 'eslint-plugin-react-native-a11y'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import importX from 'eslint-plugin-import-x'
import lingui from 'eslint-plugin-lingui'
import reactCompiler from 'eslint-plugin-react-compiler'
import bskyInternal from 'eslint-plugin-bsky-internal'
import globals from 'globals'

export default tseslint.config(
  // Global ignores
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

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Main configuration for all JS/TS/JSX/TSX files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      'react-native-a11y': reactNativeA11y,
      'simple-import-sort': simpleImportSort,
      'import-x': importX,
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
        ...globals.es2021,
      },
      parserOptions: {
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
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React Native rules
      'react-native/no-inline-styles': 'off',

      // React Native A11y rules (iOS focused)
      ...reactNativeA11y.configs.ios.rules,

      // Bsky internal rules
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

      // Import sorting
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

      // React Compiler
      'react-compiler/react-compiler': 'warn',

      // TypeScript rules
      'no-unused-vars': 'off',
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
      // Keep disabled - too many violations to fix now
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Import rules
      'import-x/consistent-type-specifier-style': ['warn', 'prefer-inline'],

      // Keep disabled - many are intentional empty destructuring patterns
      'no-empty-pattern': 'off',
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
)
