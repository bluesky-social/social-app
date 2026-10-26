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
   * The worklets Babel plugin writes generated JS into this directory whenever
   * Metro bundles, which would otherwise change the fingerprint of any checkout
   * that has run Metro and make EAS build cache lookups miss. Only `*.js` is
   * ignored so the shipped `dummy.md` keeps clean-install hashes unchanged.
   */
  ignorePaths: ['**/node_modules/react-native-worklets/.worklets/*.js'],
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
