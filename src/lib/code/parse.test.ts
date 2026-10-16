import {
  type Facet,
  RichText as RichTextAPI,
  UnicodeString,
} from '@bsky/sdk/richtext'

import {parseCodeRegions, segmentRichTextCode} from '#/lib/code/parse'

const originalPost =
  'Hey yo @bsky.app you should render embedded code blocks in our posts:\n\n```html\n<p>Like this</p>\n```'

/** UTF-8 range of the first `part` in `text`. */
function rangeOf(text: string, part: string) {
  const unicodeText = new UnicodeString(text)
  const index = text.indexOf(part)
  return {
    start: unicodeText.utf16IndexToUtf8Index(index),
    end: unicodeText.utf16IndexToUtf8Index(index + part.length),
  }
}

function mention(text: string, handle: string): Facet {
  const {start, end} = rangeOf(text, handle)
  return {
    index: {byteStart: start, byteEnd: end},
    features: [
      {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:example'},
    ],
  }
}

function textSegments(result: ReturnType<typeof segmentRichTextCode>) {
  return (result?.segments ?? []).flatMap(segment =>
    segment.type === 'text' ? [segment.richText] : [],
  )
}

describe('parseCodeRegions', () => {
  it('finds a fenced block with its language and byte range', () => {
    expect(parseCodeRegions(originalPost)).toEqual([
      {
        type: 'block',
        ...rangeOf(originalPost, '```html'),
        end: new UnicodeString(originalPost).length,
        code: '<p>Like this</p>',
        lang: 'html',
      },
    ])
  })

  it('reports UTF-8 offsets after non-ASCII text', () => {
    const text = '👋 café `世界` done'
    expect(parseCodeRegions(text)).toEqual([
      {type: 'inline', ...rangeOf(text, '`世界`'), code: '世界'},
    ])
  })

  it.each([
    ['plain prose', 'no code here'],
    ['tildes in prose', 'about ~5 minutes ~ish'],
    ['an unmatched backtick', 'it`s fine'],
    ['indented code', '    const a = 1'],
    ['a fence indented four spaces', '    ```\n    x\n    ```'],
  ])('ignores %s', (_name, text) => {
    expect(parseCodeRegions(text)).toEqual([])
  })

  it('accepts tilde fences and fences indented up to three spaces', () => {
    expect(parseCodeRegions('~~~\na\n~~~')).toMatchObject([{code: 'a'}])
    expect(parseCodeRegions('   ```\na\n   ```')).toMatchObject([{code: 'a'}])
  })

  it('closes a fence only with one of the same kind and length', () => {
    expect(parseCodeRegions('````\n```\n~~~~\n````')).toMatchObject([
      {code: '```\n~~~~'},
    ])
  })

  it('runs an unclosed fence to the end of the text', () => {
    const text = '```\na\n\nb'
    expect(parseCodeRegions(text)).toEqual([
      {type: 'block', start: 0, end: text.length, code: 'a\n\nb'},
    ])
  })

  it('keeps line endings inside a block', () => {
    expect(parseCodeRegions('```\na\r\nb\r\n```')).toMatchObject([
      {code: 'a\r\nb'},
    ])
  })

  it('normalizes inline code like CommonMark', () => {
    expect(
      parseCodeRegions('`` `x` `` and ` a\nb `').map(region => region.code),
    ).toEqual(['`x`', 'a b'])
  })

  it('keeps other Markdown from changing where code starts and ends', () => {
    expect(
      parseCodeRegions('[`a](b)` **`c`** <https://d`e>`').map(
        region => region.code,
      ),
    ).toEqual(['a](b)', 'c', 'e>'])
  })

  it('includes quote markers before a fence but not in its code', () => {
    const text = 'Look:\n> ```ts\n> x\n> ```\n> after'
    expect(parseCodeRegions(text)).toEqual([
      {
        type: 'block',
        ...rangeOf(text, '> ```ts\n> x\n> ```'),
        code: 'x',
        lang: 'ts',
      },
    ])
  })

  it('accounts for a leading BOM', () => {
    expect(parseCodeRegions('﻿`x`')).toEqual([
      {type: 'inline', start: 3, end: 6, code: 'x'},
    ])
  })
})

describe('segmentRichTextCode', () => {
  it('returns null for text without code', () => {
    expect(segmentRichTextCode(new RichTextAPI({text: 'hello'}))).toBeNull()
  })

  it('splits text around code and keeps facets outside it', () => {
    const richText = new RichTextAPI({
      text: originalPost,
      facets: [mention(originalPost, '@bsky.app')],
    })
    const result = segmentRichTextCode(richText)

    expect(result?.segments.map(segment => segment.type)).toEqual([
      'text',
      'block',
    ])
    const [prose] = textSegments(result)
    expect(prose.text).toBe(
      'Hey yo @bsky.app you should render embedded code blocks in our posts:',
    )
    expect(prose.facets).toEqual(richText.facets)
    expect(result?.richText.text).toBe(originalPost)
    expect(result?.richText.facets).toEqual(richText.facets)
  })

  it('drops facets that overlap code and rebases the rest', () => {
    const text = '`@a` @b 👋 `x` @c'
    const [a, b, c] = ['@a', '@b', '@c'].map(handle => mention(text, handle))
    const result = segmentRichTextCode(
      new RichTextAPI({text, facets: [a, b, c]}),
    )

    expect(result?.richText.facets).toEqual([b, c])
    const [first, last] = textSegments(result)
    expect(first.text).toBe(' @b 👋 ')
    expect(first.facets?.map(facet => facet.index)).toEqual([
      {byteStart: 1, byteEnd: 3},
    ])
    expect(last.text).toBe(' @c')
    expect(last.facets?.map(facet => facet.index)).toEqual([
      {byteStart: 1, byteEnd: 3},
    ])
  })

  it('drops line breaks around blocks only', () => {
    const text = 'a\n\n```\nx\n```\n\nb `y`\nc'
    expect(
      textSegments(segmentRichTextCode(new RichTextAPI({text}))).map(
        richText => richText.text,
      ),
    ).toEqual(['a', 'b ', '\nc'])
  })
})
