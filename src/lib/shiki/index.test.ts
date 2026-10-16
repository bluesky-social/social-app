import {type ThemeName} from '@bsky.app/alf'
import {createHighlighterCore, type HighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'

import {shikiLangs, tokenizeCode} from '#/lib/shiki'
import {getCodeThemeName, shikiThemes} from '#/lib/shiki/themes'
import {themes} from '#/alf/themes'
import {contrastRatio} from '#/alf/util/colorGeneration'

jest.mock('#/lib/shiki/engine', () => ({createEngine: jest.fn()}))

const themeNames: ThemeName[] = ['light', 'dim', 'dark']
const theme = getCodeThemeName('light')

let highlighter: HighlighterCore

beforeAll(async () => {
  highlighter = await createHighlighterCore({
    langs: shikiLangs,
    themes: shikiThemes,
    engine: createOnigurumaEngine(
      import('@shikijs/engine-oniguruma/wasm-inlined'),
    ),
  })
})

afterAll(() => {
  highlighter?.dispose()
})

describe('tokenizeCode', () => {
  it.each(['python', 'not-a-language'])(
    'renders unbundled %s as plain text',
    lang => {
      const code = 'def greet():\n    print("hello")'
      expect(tokenizeCode(highlighter, code, {lang, theme})).toEqual(
        highlighter.codeToTokensBase(code, {lang: 'text', theme}),
      )
    },
  )

  it.each(['javascript', 'js', 'tsx', 'json', 'bash', 'sh'])(
    'highlights bundled %s',
    lang => {
      const tokens = tokenizeCode(highlighter, 'const a = "b" // c', {
        lang,
        theme,
      })
      expect(
        new Set(tokens.flat().map(token => token.color)).size,
      ).toBeGreaterThan(1)
    },
  )

  it.each(['text', 'plaintext', ''])('keeps the plain mode %j', lang => {
    const code = 'const a = 1'
    expect(tokenizeCode(highlighter, code, {lang, theme})).toEqual(
      highlighter.codeToTokensBase(code, {lang, theme}),
    )
  })
})

describe('code themes', () => {
  it.each(themeNames)('keeps every %s token color readable', name => {
    const codeTheme = shikiThemes.find(
      item => item.name === getCodeThemeName(name),
    )!
    const colors = [
      codeTheme.fg,
      ...codeTheme.tokenColors.map(rule => rule.settings.foreground),
    ]
    for (const color of colors) {
      expect(Object.values(themes[name].palette)).toContain(color)
      expect(contrastRatio(color, codeTheme.bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(themeNames)('colors HTML with the %s palette', name => {
    const {palette, atoms} = themes[name]
    const tokens = tokenizeCode(
      highlighter,
      '<p class="greeting">Hi</p> <!-- note -->',
      {lang: 'html', theme: getCodeThemeName(name)},
    ).flat()
    const colorOf = (content: string) =>
      tokens.find(token => token.content.includes(content))?.color

    expect(colorOf('p')).toBe(palette.primary_600)
    expect(colorOf('greeting')).toBe(
      name === 'light' ? palette.positive_700 : palette.positive_500,
    )
    expect(colorOf('note')).toBe(palette.contrast_600)
    expect(colorOf('Hi')).toBe(atoms.text.color)
  })
})
