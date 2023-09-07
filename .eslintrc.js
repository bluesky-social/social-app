module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'plugin:react-native-a11y/ios',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'detox'],
  rules: {
    'react-native/no-inline-styles': 0,
  },
  ignorePatterns: [
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
  ],
}
