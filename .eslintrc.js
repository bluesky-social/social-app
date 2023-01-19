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
        semi: [2, 'never'],
      },
    },
  ],
}
