import {type ThemeName} from '@bsky.app/alf'
import {createHighlighterCore, type HighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'
import html from '@shikijs/langs/html'

import {DEFAULT_THEME_NAME, getCodeTheme, shikiThemes} from '#/lib/shiki/themes'
import {tokenizeCode} from '#/lib/shiki/tokenize'
import {themes} from '#/alf/themes'
import {contrastRatio} from '#/alf/util/colorGeneration'

const themeNames: ThemeName[] = ['light', 'dim', 'dark']

describe('code themes', () => {
  let highlighter: HighlighterCore

  beforeAll(async () => {
    highlighter = await createHighlighterCore({
      langs: [html],
      themes: shikiThemes,
      engine: createOnigurumaEngine(
        import('@shikijs/engine-oniguruma/wasm-inlined'),
      ),
    })
  })

  afterAll(() => {
    highlighter?.dispose()
  })

  it('loads distinct light, dim, and dark app themes', () => {
    expect(highlighter.getLoadedThemes().sort()).toEqual(
      ['bluesky-light', 'bluesky-dim', 'bluesky-dark'].sort(),
    )
    expect(DEFAULT_THEME_NAME).toBe(getCodeTheme('dim').name)
  })

  it.each(themeNames)(
    'uses the %s ALF code surface and normal text color',
    name => {
      expect(getCodeTheme(name)).toEqual({
        name: `bluesky-${name}`,
        backgroundColor: themes[name].atoms.bg_contrast_25.backgroundColor,
        color: themes[name].atoms.text.color,
      })
    },
  )

  it.each(themeNames)('keeps every %s token foreground readable', name => {
    const theme = shikiThemes.find(item => item.name === `bluesky-${name}`)!
    const foregrounds = [
      theme.fg,
      ...theme.tokenColors.map(rule => rule.settings.foreground),
    ]

    for (const foreground of foregrounds) {
      expect(Object.values(themes[name].palette)).toContain(foreground)
      expect(contrastRatio(foreground, theme.bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(themeNames)('colors literal HTML with the %s app palette', name => {
    const code = '<p class="greeting">Hello</p><br /> <!-- comment -->'
    const theme = getCodeTheme(name)
    const tokens = tokenizeCode(highlighter, code, {
      lang: 'html',
      theme: theme.name,
    }).flat()
    const positive =
      name === 'light'
        ? themes[name].palette.positive_700
        : themes[name].palette.positive_500

    expect(tokens.map(token => token.content).join('')).toBe(code)
    for (const tagPart of ['<p', '>', '</p>', '<br', '/>']) {
      const start = code.indexOf(tagPart)
      for (let offset = start; offset < start + tagPart.length; offset++) {
        const token = tokens.find(
          item =>
            offset >= item.offset && offset < item.offset + item.content.length,
        )
        expect(token?.color).toBe(themes[name].palette.primary_600)
      }
    }
    expect(
      tokens.find(token => token.content.includes('greeting'))?.color,
    ).toBe(positive)
    expect(tokens.find(token => token.content.includes('comment'))?.color).toBe(
      themes[name].palette.contrast_600,
    )
    for (const token of tokens) {
      expect(
        contrastRatio(token.color || theme.color, theme.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(themeNames)(
    'uses normal %s foreground for plain-text fallback',
    name => {
      const code = '<literal> unsupported language </literal>'
      const theme = getCodeTheme(name)
      const tokens = tokenizeCode(highlighter, code, {
        lang: 'unsupported-language',
        theme: theme.name,
      }).flat()

      expect(tokens.map(token => token.content).join('')).toBe(code)
      expect(tokens.map(token => token.color || theme.color)).toEqual(
        tokens.map(() => themes[name].atoms.text.color),
      )
    },
  )
})
