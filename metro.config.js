// Learn more https://docs.expo.io/guides/customizing-metro
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const cfg = getSentryExpoConfig(__dirname)

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

// Enabled by default in RN 0.79+, but this breaks Lingui + others
cfg.resolver.unstable_enablePackageExports = false

cfg.resolver.resolveRequest = (context, moduleName, platform) => {
  // HACK: manually resolve a few packages that use `exports` in `package.json`.
  // A proper solution is to enable `unstable_enablePackageExports` but this needs careful testing.
  if (moduleName.startsWith('multiformats/hashes/hasher')) {
    return context.resolveRequest(
      context,
      'multiformats/cjs/src/hashes/hasher',
      platform,
    )
  }
  if (moduleName.startsWith('multiformats/cid')) {
    return context.resolveRequest(context, 'multiformats/cjs/src/cid', platform)
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
