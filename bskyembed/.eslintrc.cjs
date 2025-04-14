module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'preact',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'no-else-return': 'off',
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
