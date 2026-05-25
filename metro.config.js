// Learn more https://docs.expo.io/guides/customizing-metro
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const cfg = getSentryExpoConfig(__dirname)

// inject `.e2e.ts` and `.e2e.tsx` into the sourceExts when running tests
cfg.resolver.sourceExts = process.env.RN_SRC_EXT
  ? process.env.RN_SRC_EXT.split(',').concat(cfg.resolver.sourceExts)
  : cfg.resolver.sourceExts

if (cfg.resolver.resolveRequest) {
  throw Error('Update this override because it is conflicting now.')
}

// Enforce "no RNGH on web"
cfg.resolver.blockList = [/react-native-gesture-handler\/.*/]

// Stub out unused Sentry integrations. They're statically imported by
// @sentry/browser's barrel, so we can't drop them via blockList; we redirect
// the imports to an empty module instead. ~185KB of dead weight on web.
const STUBBED_PACKAGES = new Set([
  '@sentry-internal/replay',
  '@sentry-internal/replay-canvas',
  '@sentry-internal/feedback',
])
const emptyModulePath =
  require.resolve('metro-runtime/src/modules/empty-module.js')

if (process.env.BSKY_PROFILE) {
  cfg.cacheVersion += ':PROFILE'
}

cfg.resolver.assetExts = [...cfg.resolver.assetExts, 'woff2']

cfg.resolver.resolveRequest = (context, moduleName, platform) => {
  if (process.env.BSKY_PROFILE) {
    if (moduleName.endsWith('ReactNativeRenderer-prod')) {
      return context.resolveRequest(
        context,
        moduleName.replace('-prod', '-profiling'),
        platform,
      )
    }
  }
  if (platform === 'web' && STUBBED_PACKAGES.has(moduleName)) {
    return {type: 'sourceFile', filePath: emptyModulePath}
  }
  return context.resolveRequest(context, moduleName, platform)
}

cfg.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
})

module.exports = cfg
