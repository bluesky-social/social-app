// Learn more https://docs.expo.io/guides/customizing-metro
// See https://docs.expo.dev/guides/using-sentry/#update-metro-configuration
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const cfg = getSentryExpoConfig(__dirname)

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
