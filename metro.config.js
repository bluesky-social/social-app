// Learn more https://docs.expo.io/guides/customizing-metro
const fs = require('fs')
const path = require('path')
const {getDefaultConfig} = require('expo/metro-config')
const cfg = getDefaultConfig(__dirname)

if (process.env.ATPROTO_ROOT) {
  const atprotoPackages = path.resolve(process.env.ATPROTO_ROOT, 'packages')

  cfg.watchFolders ||= []
  cfg.watchFolders.push(
    ...fs
      .readdirSync(atprotoPackages)
      .map(dir => path.join(atprotoPackages, dir))
      .filter(dir => fs.statSync(dir).isDirectory()),
  )

  const resolveRequest = cfg.resolver.resolveRequest
  cfg.resolver.resolveRequest = (context, moduleName, platform) => {
    // When resolving a module from the atproto packages, try finding it there
    // first. If it's not found, try resolving it from the project root (here).
    if (context.originModulePath.startsWith(atprotoPackages)) {
      try {
        return context.resolveRequest(context, moduleName, platform)
      } catch (err) {
        // If a module is not found in the atproto packages, try and resolve it
        // from here (e.g. @babel polyfills)
        return {
          type: 'sourceFile',
          filePath: require.resolve(moduleName),
        }
      }
    }

    // When resolving an @atproto/* module, replace the path prefix with
    // <atprotoPackages>.
    if (moduleName.startsWith('@atproto/')) {
      const [prefix, suffix] = moduleName.split('/', 2)
      const resolution = context.resolveRequest(context, moduleName, platform)
      const relativePathIdx = resolution.filePath.lastIndexOf(moduleName)
      const relativePath = resolution.filePath.slice(
        relativePathIdx + moduleName.length + 1,
      )
      return {
        type: 'sourceFile',
        filePath: path.join(atprotoPackages, suffix, relativePath),
      }
    }

    return (resolveRequest || context.resolveRequest)(
      context,
      moduleName,
      platform,
    )
  }
}

cfg.resolver.sourceExts = process.env.RN_SRC_EXT
  ? process.env.RN_SRC_EXT.split(',').concat(cfg.resolver.sourceExts)
  : cfg.resolver.sourceExts

cfg.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
    nonInlinedRequires: [
      // We can remove this option and rely on the default after
      // https://github.com/facebook/metro/pull/1126 is released.
      'React',
      'react',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'react-native',
    ],
  },
})

module.exports = cfg
