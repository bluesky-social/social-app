/**
 * React Compiler tags generated nodes with loc = Symbol(GeneratedSource),
 * which breaks the structuredClone Metro performs on the AST when
 * EXPO_UNSTABLE_TREE_SHAKING is enabled. Strip them after all other
 * transforms have run.
 *
 * @returns {import('@babel/core').PluginObj}
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
 * Inline Sentry's debug flags before Metro tree shaking. Replacing only the
 * global is insufficient because Metro cannot propagate DEBUG_BUILD's value
 * across module boundaries to remove the guarded logging code.
 *
 * @param {{types: typeof import('@babel/types')}} api
 * @returns {import('@babel/core').PluginObj}
 */
const stripSentryDebug = ({types}) => ({
  visitor: {
    ImportDeclaration(path, state) {
      if (
        !/[/\\]node_modules[/\\]@sentry[/\\]/.test(state.filename ?? '') ||
        !/^(?:\.\.?\/)+debug-build(?:\.js)?$/.test(path.node.source.value)
      ) {
        return
      }

      for (const specifier of path.get('specifiers')) {
        if (
          !specifier.isImportSpecifier() ||
          !types.isIdentifier(specifier.node.imported, {name: 'DEBUG_BUILD'})
        ) {
          continue
        }
        const binding = path.scope.getBinding(specifier.node.local.name)
        for (const reference of binding?.referencePaths ?? []) {
          // Preserve re-exports; only replace expressions using this binding.
          if (!reference.parentPath.isExportSpecifier()) {
            reference.replaceWith(types.booleanLiteral(false))
          }
        }
      }
    },
    ReferencedIdentifier(path) {
      if (
        path.node.name === '__SENTRY_DEBUG__' &&
        !path.scope.hasBinding('__SENTRY_DEBUG__')
      ) {
        path.replaceWith(types.booleanLiteral(false))
      }
    },
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
      ...(api.env('production')
        ? ['transform-remove-console', stripSentryDebug]
        : []),

      stripSymbolLocs,
      'react-native-worklets/plugin', // NOTE: this plugin MUST be last
    ],
  }
}
