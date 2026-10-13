import {createHighlighterCore, type HighlighterCore} from '@shikijs/core'
import {createOnigurumaEngine} from '@shikijs/engine-oniguruma'

import {shikiLangs} from '#/lib/shiki/langs'
import {DEFAULT_THEME_NAME, shikiThemes} from '#/lib/shiki/themes'
import {tokenizeCode} from '#/lib/shiki/tokenize'

const bundledExamples: Record<string, string> = {
  javascript: 'const greeting = "hello"; console.log(greeting)',
  typescript: 'const greeting: string = "hello"',
  tsx: 'const heading = <h1>{"hello"}</h1>',
  jsx: 'const heading = <h1>{"hello"}</h1>',
  json: '{"greeting": "hello", "count": 42}',
  shellscript: 'echo "$HOME" # a comment',
  markdown: '# Heading\n\n**bold** and `code`',
  html: '<p class="greeting">Hello</p>',
  css: 'p { color: red; }',
}

const bundledLanguageCases = shikiLangs.flat().flatMap(language =>
  [language.name, ...(language.aliases ?? [])].map(lang => ({
    lang,
    code: bundledExamples[language.name],
  })),
)

describe('tokenizeCode', () => {
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

  it.each([
    {lang: 'python', code: 'def greet():\n    print("hello")'},
    {lang: 'not-a-language', code: 'arbitrary source text'},
  ])('renders unbundled $lang as plain text', ({lang, code}) => {
    expect(() =>
      highlighter.codeToTokensBase(code, {lang, theme: DEFAULT_THEME_NAME}),
    ).toThrow()

    const tokens = tokenizeCode(highlighter, code, {
      lang,
      theme: DEFAULT_THEME_NAME,
    })

    expect(tokens).toEqual(
      highlighter.codeToTokensBase(code, {
        lang: 'text',
        theme: DEFAULT_THEME_NAME,
      }),
    )
    expect(
      tokens.map(line => line.map(token => token.content).join('')).join('\n'),
    ).toBe(code)
  })

  it.each(bundledLanguageCases)(
    'preserves highlighting for bundled language or alias $lang',
    ({lang, code}) => {
      const options = {lang, theme: DEFAULT_THEME_NAME}
      const tokens = tokenizeCode(highlighter, code, options)

      expect(tokens).toEqual(highlighter.codeToTokensBase(code, options))
      expect(
        new Set(tokens.flat().map(token => token.color)).size,
      ).toBeGreaterThan(1)
    },
  )

  it.each(['text', 'txt', 'plaintext', 'plain', ''])(
    'preserves the special plain-text mode %j',
    lang => {
      const code = 'const greeting = "hello"\n\tこんにちは 👩🏽‍💻\n'
      const options = {lang, theme: DEFAULT_THEME_NAME}

      expect(tokenizeCode(highlighter, code, options)).toEqual(
        highlighter.codeToTokensBase(code, options),
      )
    },
  )

  it('preserves ANSI colors and strips their escape sequences', () => {
    const code = '\u001b[31mred\u001b[0m plain'
    const options = {lang: 'ansi', theme: DEFAULT_THEME_NAME}
    const tokens = tokenizeCode(highlighter, code, options)

    expect(tokens).toEqual(highlighter.codeToTokensBase(code, options))
    expect(
      tokens
        .flat()
        .map(token => token.content)
        .join(''),
    ).toBe('red plain')
    expect(
      new Set(tokens.flat().map(token => token.color)).size,
    ).toBeGreaterThan(1)
  })

  it.each([
    {name: 'Unicode', code: 'こんにちは 👩🏽‍💻 café'},
    {name: 'tabs and spaces', code: '  \tindented\t  '},
    {name: 'blank lines', code: 'first\n\nthird'},
    {name: 'trailing newline', code: 'first\n'},
    {name: 'empty input', code: ''},
    {name: 'only newlines', code: '\n\n'},
  ])('keeps $name when falling back to plain text', ({code}) => {
    const tokens = tokenizeCode(highlighter, code, {
      lang: 'python',
      theme: DEFAULT_THEME_NAME,
    })

    expect(
      tokens.map(line => line.map(token => token.content).join('')).join('\n'),
    ).toBe(code)
    expect(tokens).toEqual(
      highlighter.codeToTokensBase(code, {
        lang: 'text',
        theme: DEFAULT_THEME_NAME,
      }),
    )
  })

  it('uses Shiki line splitting and source offsets for CRLF input', () => {
    const code = 'first\r\n\tこんにちは\r\n\r\n'
    const tokens = tokenizeCode(highlighter, code, {
      lang: 'python',
      theme: DEFAULT_THEME_NAME,
    })

    expect(tokens).toEqual([
      [{content: 'first', offset: 0}],
      [{content: '\tこんにちは', offset: 7}],
      [{content: '', offset: 15}],
      [{content: '', offset: 17}],
    ])
  })

  it('propagates an invalid theme error for a bundled language', () => {
    expect(() =>
      tokenizeCode(highlighter, 'const count = 42', {
        lang: 'javascript',
        theme: 'not-a-theme',
      }),
    ).toThrow('Theme `not-a-theme` not found')
  })

  it('propagates tokenizer failures when using the plain-text fallback', () => {
    const error = new Error('Tokenization failed')
    const tokenize = jest
      .spyOn(highlighter, 'codeToTokensBase')
      .mockImplementationOnce(() => {
        throw error
      })

    try {
      expect(() =>
        tokenizeCode(highlighter, 'source text', {
          lang: 'not-a-language',
          theme: DEFAULT_THEME_NAME,
        }),
      ).toThrow(error)
    } finally {
      tokenize.mockRestore()
    }
  })
})
