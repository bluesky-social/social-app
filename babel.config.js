/**
 * @param {import("@babel/core").ConfigAPI} api
 * @returns {import("@babel/core").InputOptions}
 */
module.exports = function (api) {
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          lazyImports: true,
          native: {
            // Disable ESM -> CJS compilation because Metro takes care of it.
            // However, we need it in Jest tests since those run without Metro.
            disableImportExportTransform: !api.env('test'),
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

      // cannot use `env` field because it will put them after
      // the `react-native-worklets/plugin` plugin
      ...(api.env('test')
        ? ['@babel/plugin-transform-class-static-block']
        : []),
      ...(api.env('production') ? ['transform-remove-console'] : []),

      'react-native-worklets/plugin', // NOTE: this plugin MUST be last
    ],
  }
}
