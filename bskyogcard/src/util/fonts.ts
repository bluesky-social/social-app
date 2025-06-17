import {readdirSync, readFileSync} from 'node:fs'
import * as path from 'node:path'

const __DIRNAME = path.join(process.cwd(), 'src')

export const ADDITIONAL_FONTS = [
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@5.0/japanese-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc@5.0/chinese-traditional-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@5.0/chinese-simplified-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hk@5.0/chinese-hongkong-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@5.0/korean-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@5.0/thai-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-arabic@5.0/arabic-700-normal.ttf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hebrew@5.0/hebrew-700-normal.ttf',
]

/**
 * CSS `fontFamily` defs must use the PostScript names of the fonts. When
 * adding additional fonts above, you'll need to figure out the PostScript name
 * and add it to the map below.
 */
export const ADDITIONAL_FONTS_POSTSCRIPT_NAMES: Record<string, string> = {
  arabic: 'Noto Sans Arabic',
  hebrew: 'Noto Sans Hebrew',
  japanese: 'Noto Sans JP Thin',
  korean: 'Noto Sans KR',
  thai: 'Noto Sans Thai',
  'chinese-hongkong': 'Noto Sans HK',
  'chinese-simplified': 'Noto Sans SC',
  'chinese-traditional': 'Noto Sans TC',
}

/**
 * Precomputed, for use in the runtime CSS defs
 */
export const FONT_FAMILY_DEF = `Inter, ${Object.values(
  ADDITIONAL_FONTS_POSTSCRIPT_NAMES,
).join(', ')}, sans-serif`

/**
 * Get all TTF files from our fonts dir
 */
export function getFontFiles() {
  const fontDirectory = path.join(__DIRNAME, 'assets', 'fonts')
  return readdirSync(fontDirectory)
    .filter(file => file.endsWith('.ttf'))
    .map(file => path.join(fontDirectory, file))
}

/**
 * Get all font files and format for use by Satori
 */
export function getFontDefinitions() {
  return getFontFiles().map(file => {
    const basename = path.basename(file, path.extname(file))
    const italic = basename.includes('Italic')
    const [weight, postScriptName] = basename.split('-')

    return {
      name: postScriptName,
      data: readFileSync(file),
      weight: parseInt(weight),
      style: italic ? 'italic' : 'normal',
    }
  })
}
