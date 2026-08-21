/**
 * React Compiler tags generated nodes with loc = Symbol(GeneratedSource),
 * which breaks the structuredClone Metro performs on the AST when
 * EXPO_UNSTABLE_TREE_SHAKING is enabled. Strip them after all other
 * transforms have run.
 */
const stripSymbolLocs = () => ({
  post(file) {
    file.path.traverse({
      enter(path) {
        if (typeof path.node.loc === 'symbol') {
          path.node.loc = undefined
        }
      },
    })
    if (typeof file.ast.program.loc === 'symbol') {
      file.ast.program.loc = undefined
    }
  },
})

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

      stripSymbolLocs,
      'react-native-worklets/plugin', // NOTE: this plugin MUST be last
    ],
  }
}
