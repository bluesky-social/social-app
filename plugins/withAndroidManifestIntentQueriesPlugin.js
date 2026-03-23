const {withAndroidManifest} = require('@expo/config-plugins')

const withProcessTextQuery = config =>
  // eslint-disable-next-line no-shadow
  withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest

    // Ensure <queries> stub exists
    if (!manifest.queries) manifest.queries = [{}]
    const queries = manifest.queries[0]

    queries.intent = queries.intent || []

    const exists = queries.intent.some(
      i =>
        i.action?.[0]?.$?.['android:name'] ===
        'android.intent.action.PROCESS_TEXT',
    )

    if (!exists) {
      queries.intent.push({
        action: [{$: {'android:name': 'android.intent.action.PROCESS_TEXT'}}],
        data: [{$: {'android:mimeType': 'text/plain'}}],
      })
    }

    return config
  })

module.exports = withProcessTextQuery
