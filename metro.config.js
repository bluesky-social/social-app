// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path')
const {getDefaultConfig} = require('expo/metro-config')
const cfg = getDefaultConfig(__dirname)

if (process.env.ATPROTO_ROOT) {
  const atprotoRoot = path.resolve(process.cwd(), process.env.ATPROTO_ROOT)

  // Watch folders are used as roots for the virtual file system. Any file that
  // needs to be resolved by the metro bundler must be within one of the watch
  // folders. Since we will be resolving dependencies from the atproto packages,
  // we need to add the atproto root to the watch folders so that the
  cfg.watchFolders ||= []
  cfg.watchFolders.push(atprotoRoot)

  const resolveRequest = cfg.resolver.resolveRequest
  cfg.resolver.resolveRequest = (context, moduleName, platform) => {
    // Alias @atproto/* modules to the corresponding package in the atproto root
    if (moduleName.startsWith('@atproto/')) {
      const [, packageName] = moduleName.split('/', 2)
      const packagePath = path.join(atprotoRoot, 'packages', packageName)
      return context.resolveRequest(context, packagePath, platform)
    }

    // Polyfills are added by the build process and are not actual dependencies
    // of the @atproto/* packages. Resolve those from here.
    if (
      moduleName.startsWith('@babel/') &&
      context.originModulePath.startsWith(atprotoRoot)
    ) {
      return {
        type: 'sourceFile',
        filePath: require.resolve(moduleName),
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

if (cfg.resolver.resolveRequest) {
  throw Error('Update this override because it is conflicting now.')
}

if (process.env.BSKY_PROFILE) {
  cfg.cacheVersion += ':PROFILE'
}

cfg.resolver.assetExts = [...cfg.resolver.assetExts, 'woff2']

cfg.resolver.resolveRequest = (context, moduleName, platform) => {
  // HACK: manually resolve a few packages that use `exports` in `package.json`.
  // A proper solution is to enable `unstable_enablePackageExports` but this needs careful testing.
  if (moduleName.startsWith('multiformats/hashes/hasher')) {
    return context.resolveRequest(
      context,
      'multiformats/dist/src/hashes/hasher',
      platform,
    )
  }
  if (moduleName.startsWith('multiformats/cid')) {
    return context.resolveRequest(
      context,
      'multiformats/dist/src/cid',
      platform,
    )
  }
  if (moduleName === '@ipld/dag-cbor') {
    return context.resolveRequest(context, '@ipld/dag-cbor/src', platform)
  }
  if (process.env.BSKY_PROFILE) {
    if (moduleName.endsWith('ReactNativeRenderer-prod')) {
      return context.resolveRequest(
        context,
        moduleName.replace('-prod', '-profiling'),
        platform,
      )
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

cfg.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
    nonInlinedRequires: [
      // We can remove this option and rely on the default after
      // https://github.com/facebook/metro/pull/1390 is released.
      'React',
      'react',
      'react-compiler-runtime',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'react-native',
    ],
  },
})

module.exports = cfg
