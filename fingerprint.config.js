/** @type {import('@expo/fingerprint').Config} */
const config = {
  /*
   * Expo 58 changed the default to 'balanced', which hashes autolinked native
   * modules and config plugins by their package.json version and ignores
   * eas.json and app version changes. Stick with the historical 'strict'
   * behaviour so any change to native sources changes the fingerprint.
   */
  preset: 'strict',
  /*
   * The nano icon fonts are linked into the native binary, but the fingerprint
   * only sees the plugin config, not the icons. Without this, adding or
   * changing an icon would ship as an OTA update to binaries whose font lacks
   * the new glyphs, and those icons would render blank.
   */
  extraSources: ['ui', 'brands', 'community'].map(lane => ({
    type: 'file',
    filePath: `assets/nano-icons/nanoicons/icons-${lane}.ttf`,
    reasons: ['react-native-nano-icons font'],
  })),
}

module.exports = config
