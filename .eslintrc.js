module.exports = {
  root: true,
  extends: '@react-native-community',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['**/__mocks__/*.ts'],
  overrides: [
    {
      files: ['*.js', '*.mjs', '*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': 'off',
        'no-shadow': 'off',
        'no-undef': 'off',
        semi: [2, 'never'],
      },
    },
  ],
}
