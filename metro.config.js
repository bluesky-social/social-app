/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const metroResolver = require('metro-resolver')
const path = require('path')
console.log(metroResolver)

module.exports = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // metro doesn't support the "exports" directive in package.json
      // so we have to manually fix some imports
      // see https://github.com/facebook/metro/issues/670
      if (moduleName.startsWith('ucans')) {
        const subpath = moduleName.split('/').slice(1)
        if (subpath.length === 0) {
          subpath.push('index.js')
        } else {
          subpath[subpath.length - 1] = `${subpath[subpath.length - 1]}.js`
        }
        const filePath = path.join(
          context.projectRoot,
          'node_modules',
          'ucans',
          'dist',
          'cjs',
          ...subpath,
        )
        return {
          type: 'sourceFile',
          filePath,
        }
      }
      if (moduleName === 'one-webcrypto') {
        return {
          type: 'sourceFile',
          filePath: path.join(
            context.projectRoot,
            'node_modules',
            'one-webcrypto',
            'browser.mjs',
          ),
        }
      }

      // default resolve
      delete context.resolveRequest
      return metroResolver.resolve(context, moduleName, platform)
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}
