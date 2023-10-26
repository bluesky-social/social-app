// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('expo/metro-config')
const cfg = getDefaultConfig(__dirname)

cfg.resolver.sourceExts = process.env.RN_SRC_EXT
  ? process.env.RN_SRC_EXT.split(',').concat(cfg.resolver.sourceExts)
  : cfg.resolver.sourceExts

cfg.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
})

module.exports = cfg
