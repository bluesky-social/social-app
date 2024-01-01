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
            // We should be able to remove this after upgrading Expo
            // to a version that includes https://github.com/expo/expo/pull/24672.
            unstable_transformProfile: 'hermes-stable',
            // Disable ESM -> CJS compilation because Metro takes care of it.
            // However, we need it in Jest tests since those run without Metro.
            disableImportExportTransform: !isTestEnv,
          },
        },
      ],
    ],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
      [
        'module-resolver',
        {
          alias: {
            // This needs to be mirrored in tsconfig.json
            '#': './src',
            lib: './src/lib',
            platform: './src/platform',
            state: './src/state',
            view: './src/view',
            crypto: './src/platform/crypto.ts',
          },
        },
      ],
      'macros',
      'react-native-reanimated/plugin', // NOTE: this plugin MUST be last
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  }
}
