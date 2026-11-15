import brandsGlyphMap from '../../../assets/nano-icons/nanoicons/icons-brands.glyphmap.json'
import communityGlyphMap from '../../../assets/nano-icons/nanoicons/icons-community.glyphmap.json'
import uiGlyphMap from '../../../assets/nano-icons/nanoicons/icons-ui.glyphmap.json'

/**
 * One font per codegen directory under `assets/icons/`. The fonts are built
 * from those SVGs by the react-native-nano-icons config plugin, see
 * `app.config.js`.
 */
export const glyphMaps = {
  ui: uiGlyphMap,
  brands: brandsGlyphMap,
  community: communityGlyphMap,
}

export type IconSet = keyof typeof glyphMaps

/**
 * The name of a glyph in one of the icon fonts. Codegen passes it to the
 * TEMPLATE factories of icons that render as glyphs.
 */
export type NanoGlyphName = {
  [S in IconSet]: keyof (typeof glyphMaps)[S]['i']
}[IconSet]
