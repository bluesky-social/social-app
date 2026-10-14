import customGlyphMap from '../../../assets/nano-icons/nanoicons/icons-custom.glyphmap.json'
import externalGlyphMap from '../../../assets/nano-icons/nanoicons/icons-external.glyphmap.json'
import uiGlyphMap from '../../../assets/nano-icons/nanoicons/icons-ui.glyphmap.json'

/**
 * One font per font-input directory under `assets/icons/`: the generated `ui`
 * and `external` lanes, and the handwritten `custom` exceptions. The fonts are
 * built from those SVGs by the react-native-nano-icons config plugin, see
 * `app.config.js`.
 */
export const glyphMaps = {
  ui: uiGlyphMap,
  external: externalGlyphMap,
  custom: customGlyphMap,
}

export type IconSet = keyof typeof glyphMaps

/**
 * The name of a glyph in one of the icon fonts. Codegen, and the handwritten
 * `custom` components, pass it to the TEMPLATE factories of icons that render
 * as glyphs.
 */
export type NanoGlyphName = {
  [S in IconSet]: keyof (typeof glyphMaps)[S]['i']
}[IconSet]
