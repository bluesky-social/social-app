import {type NanoGlyphName} from '#/components/icons/glyphMaps'
import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'

/*
 * Web keeps the SVG icons. They paint with the first render from the JS
 * bundle, while glyphs would wait on the font download, and react-native-web
 * does not process the styles nano-icons spreads onto its DOM nodes. The
 * performance win is measured on native only.
 */
export function withNanoGlyph(
  SvgIcon: IconWithSvgMeta,
  _options: {glyph: NanoGlyphName | undefined; layered: boolean},
): IconWithSvgMeta {
  return SvgIcon
}
