module.exports = function (api) {
  api.cache(true)
  const isTestEnv = process.env.NODE_ENV === 'test'
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          lazyImports: true,
          native: {
            // Disable ESM -> CJS compilation because Metro takes care of it.
            // However, we need it in Jest tests since those run without Metro.
            disableImportExportTransform: !isTestEnv,
          },
        },
      ],
    ],
    plugins: [
      '@lingui/babel-plugin-lingui-macro',
      ['babel-plugin-react-compiler', {target: '19'}],
      'module:react-native-dotenv', // used by web build! can remove when we drop webpack
      [
        'module-resolver',
        {
          alias: {
            // This needs to be mirrored in tsconfig.json
            '#': './src',
            crypto: './src/platform/crypto.ts',
          },
        },
      ],
      'react-native-worklets/plugin', // NOTE: this plugin MUST be last
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
      test: {
        plugins: ['@babel/plugin-transform-class-static-block'],
      },
    },
  }
}
