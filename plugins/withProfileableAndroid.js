const {withAndroidManifest} = require('@expo/config-plugins')

module.exports = function withProfileableAndroid(config) {
  return withAndroidManifest(config, mod => {
    if (process.env.BSKY_PROFILE !== '1') return mod

    const manifest = mod.modResults.manifest

    // Ensure <manifest xmlns:tools="...">
    manifest.$ = manifest.$ || {}
    manifest.$['xmlns:tools'] =
      manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools'

    const app = manifest.application?.[0]
    if (!app) return mod

    app.profileable = app.profileable || []
    const already = app.profileable.some(
      p => p.$ && p.$['android:shell'] === 'true',
    )
    if (!already) {
      app.profileable.push({
        $: {
          'android:shell': 'true',
          'tools:targetApi': 'q',
        },
      })
    }

    return mod
  })
}
