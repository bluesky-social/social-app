/** @type {import('@expo/fingerprint').Config} */
const config = {
  /*
   * The nano icon font is linked into the native binary, but the fingerprint
   * only sees the plugin config, not the icons. Without this, adding or
   * changing an icon would ship as an OTA update to binaries whose font lacks
   * the new glyphs, and those icons would render blank.
   */
  extraSources: [
    {
      type: 'file',
      filePath: 'assets/nano-icons/nanoicons/app-icons.ttf',
      reasons: ['react-native-nano-icons font'],
    },
  ],
}

module.exports = config
