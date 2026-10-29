const {
  AndroidConfig,
  withAndroidManifest,
  withStringsXml,
} = require('expo/config-plugins')

/**
 * Links the app to bsky.app and bsky.social for Google Password Manager
 * credential sharing. Both sites' assetlinks.json list the app and each other.
 * The quotes must be escaped because Android drops bare double quotes in string
 * resources.
 */
const ASSET_STATEMENTS = JSON.stringify([
  {include: 'https://bsky.app/.well-known/assetlinks.json'},
  {include: 'https://bsky.social/.well-known/assetlinks.json'},
]).replaceAll('"', '\\"')

const withAndroidAssetStatements = config => {
  config = withStringsXml(config, config => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: {name: 'asset_statements', translatable: 'false'},
          _: ASSET_STATEMENTS,
        },
      ],
      config.modResults,
    )
    return config
  })

  return withAndroidManifest(config, config => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    )
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      'asset_statements',
      '@string/asset_statements',
      'resource',
    )
    return config
  })
}

module.exports = withAndroidAssetStatements
