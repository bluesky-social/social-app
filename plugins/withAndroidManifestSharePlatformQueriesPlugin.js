const {withAndroidManifest} = require('expo/config-plugins')

/**
 * Declares the share platforms' apps in the manifest's `<queries>` so Android
 * 11+ lets us check whether they're installed and send text to them. The lists
 * come from `src/components/ShareDialog/catalog.ts` via `app.config.js`.
 *
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @param {{packages: string[], schemes: string[]}} props
 */
const withSharePlatformQueries = (config, {packages, schemes}) =>
  withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest

    if (!manifest.queries) manifest.queries = [{}]
    const queries = manifest.queries[0]

    queries.package = queries.package || []
    for (const name of packages) {
      const exists = queries.package.some(p => p.$?.['android:name'] === name)
      if (!exists) {
        queries.package.push({$: {'android:name': name}})
      }
    }

    /*
     * System handlers like `sms:` and `mailto:` vary by device, so query the
     * scheme. VIEW matches what `Linking.canOpenURL` and `openURL` resolve.
     */
    queries.intent = queries.intent || []
    for (const scheme of schemes) {
      const exists = queries.intent.some(
        i =>
          i.action?.[0]?.$?.['android:name'] === 'android.intent.action.VIEW' &&
          i.data?.[0]?.$?.['android:scheme'] === scheme,
      )
      if (!exists) {
        queries.intent.push({
          action: [{$: {'android:name': 'android.intent.action.VIEW'}}],
          data: [{$: {'android:scheme': scheme}}],
        })
      }
    }

    return config
  })

module.exports = withSharePlatformQueries
