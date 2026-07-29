/**
 * @param {import("@babel/core").ConfigAPI} api
 * @returns {import("@babel/core").InputOptions}
 */
module.exports = function (api) {
  /*
   * react-native-dotenv inlines every `process.env.*` reference (in
   * node_modules too) from the transform worker's environment. Metro workers
   * run under jest-worker, which sets JEST_WORKER_ID, so keeping the plugin in
   * Metro builds bakes JEST_WORKER_ID into the app bundle and flips
   * react-native-reanimated into its Jest/web mode on device. Only the webpack
   * web build needs it.
   */
  const isWebpack = api.caller(caller => caller?.name === 'babel-loader')

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
      ...(isWebpack ? ['module:react-native-dotenv'] : []), // used by web build! can remove when we drop webpack
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
        ? [
            '@babel/plugin-transform-class-static-block',
            // Compile `import()` to require so jest (which runs without
            // `--experimental-vm-modules`) can execute lazily-loaded modules
            // like `@ipld/dag-cbor` via its moduleNameMapper.
            '@babel/plugin-transform-dynamic-import',
          ]
        : []),
      ...(api.env('production') ? ['transform-remove-console'] : []),

      'react-native-worklets/plugin', // NOTE: this plugin MUST be last
    ],
  }
}
