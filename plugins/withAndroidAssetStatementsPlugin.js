const {
  AndroidConfig,
  withAndroidManifest,
  withStringsXml,
} = require('expo/config-plugins')

/**
 * Links the app to bsky.app for Google Password Manager credential sharing.
 * bsky.app's assetlinks.json links bsky.social in turn. The quotes must be
 * escaped because Android drops bare double quotes in string resources.
 */
const ASSET_STATEMENTS =
  '[{\\"include\\": \\"https://bsky.app/.well-known/assetlinks.json\\"}]'

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
