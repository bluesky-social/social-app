import preact from 'eslint-config-preact'
import tseslint from 'typescript-eslint'
import importSort from 'eslint-plugin-simple-import-sort'

export default [
  ...preact,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      'simple-import-sort': importSort,
    },
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'no-else-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
