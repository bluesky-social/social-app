module.exports = {
  root: true,
  extends: [
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'simple-import-sort',
    'eslint-plugin-react-compiler',
  ],
  rules: {
    'react/no-unescaped-entities': 0,
    'react/prop-types': 0,
    'react-native/no-inline-styles': 0,
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
          // React/React Native priortized, followed by expo
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
  },
  ignorePatterns: [
    'coverage',
    '*.lock',
    '.husky',
    '*.html',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
}

