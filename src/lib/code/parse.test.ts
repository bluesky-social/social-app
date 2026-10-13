import {type Facet, RichText as RichTextAPI} from '@bsky/sdk/richtext'

import {parseCodeRegions, segmentRichTextCode} from '#/lib/code/parse'

const originalPost =
  'Hey yo @bsky.app you should render embedded code blocks in our posts:\n\n```html\n<p>Like this</p>\n```'

function mention(byteStart: number, byteEnd: number): Facet {
  return {
    index: {byteStart, byteEnd},
    features: [
      {
        $type: 'app.bsky.richtext.facet#mention' as const,
        did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      },
    ],
  }
}

describe('parseCodeRegions', () => {
  it('recognizes the original post and retains the body separator for Copy', () => {
    expect(parseCodeRegions(originalPost)).toEqual([
      {
        type: 'block',
        start: 71,
        end: 99,
        code: '<p>Like this</p>\n',
        displayCode: '<p>Like this</p>\n',
        lang: 'html',
      },
    ])
  })

  it('keeps the newline after a closing fence outside the code envelope', () => {
    const {segments} = segmentRichTextCode(
      new RichTextAPI({text: '```\nx\n```\n'}),
    )
    expect(segments.map(segment => segment.type)).toEqual(['block', 'text'])
    expect(segments[0]).toMatchObject({start: 0, end: 9, code: 'x\n'})
    expect(segments[1]).toMatchObject({richText: {text: '\n'}})
  })

  it('reports original UTF-8 ranges after Unicode prose', () => {
    expect(parseCodeRegions('👋 café `世界`')).toEqual([
      {
        type: 'inline',
        start: 11,
        end: 19,
        code: '世界',
        displayCode: '世界',
      },
    ])
  })

  it('recognizes arbitrary language labels independently of highlighter aliases', () => {
    expect(parseCodeRegions('~~~some-language extra\nx\n~~~')[0]).toMatchObject(
      {
        type: 'block',
        lang: 'some-language',
        code: 'x\n',
      },
    )
  })

  it.each([
    {
      name: 'LF',
      text: '```\n\t世界  \n\nlast\t \n```',
      code: '\t世界  \n\nlast\t \n',
    },
    {
      name: 'CRLF',
      text: '```\r\n\t世界  \r\n\r\nlast\t \r\n```',
      code: '\t世界  \r\n\r\nlast\t \r\n',
    },
    {name: 'empty', text: '```\n```', code: ''},
    {name: 'blank', text: '```\n\n```', code: '\n'},
    {name: 'unclosed', text: '```python\nprint(1)', code: 'print(1)'},
    {name: 'header only', text: '```python', code: ''},
  ])('preserves $name block payloads', ({text, code}) => {
    expect(parseCodeRegions(text)[0]).toMatchObject({
      type: 'block',
      code,
      displayCode: code,
    })
  })

  it('preserves source NUL and genuine replacement characters separately for Copy', () => {
    expect(parseCodeRegions('```js\na\u0000b\uFFFDc\n```')).toEqual([
      {
        type: 'block',
        start: 0,
        end: 17,
        code: 'a\u0000b\uFFFDc\n',
        displayCode: 'a\uFFFDb\uFFFDc\n',
        lang: 'js',
      },
    ])
  })

  it.each([
    {
      name: 'partial structural tab',
      text: '  ```\r\n\ta\u0000\uFFFD\t \r\n  ```',
      code: '  a\u0000\uFFFD\t \r\n',
      displayCode: '  a\uFFFD\uFFFD\t \r\n',
    },
    {
      name: 'quoted list',
      text: '> - ```js\r\n>       a\u0000\uFFFD  \r\n>   ```',
      code: '    a\u0000\uFFFD  \r\n',
      displayCode: '    a\uFFFD\uFFFD  \r\n',
    },
    {
      name: 'Unicode and literal escapes/entities',
      text: '```\n&amp; \\* 👋\t\uFFFD\u0000\r\n```',
      code: '&amp; \\* 👋\t\uFFFD\u0000\r\n',
      displayCode: '&amp; \\* 👋\t\uFFFD\uFFFD\r\n',
    },
  ])(
    'keeps $name payloads intact when retaining source NULs',
    ({text, code, displayCode}) => {
      expect(parseCodeRegions(text)[0]).toMatchObject({code, displayCode})
    },
  )

  it.each([
    {text: '```DIR```', start: 0, end: 9},
    {text: 'before ```DIR``` after', start: 7, end: 16},
  ])(
    'recognizes the three-backtick inline span in %j',
    ({text, start, end}) => {
      expect(parseCodeRegions(text)).toEqual([
        {type: 'inline', start, end, code: 'DIR', displayCode: 'DIR'},
      ])
    },
  )

  it('distinguishes Copy from normalized inline display', () => {
    expect(parseCodeRegions('x ` a\nb ` y')).toEqual([
      {type: 'inline', start: 2, end: 9, code: ' a\nb ', displayCode: 'a b'},
    ])
  })

  it('normalizes CRLF in inline display without changing the Copy interior', () => {
    expect(parseCodeRegions('` a\r\nb `')).toEqual([
      {type: 'inline', start: 0, end: 8, code: ' a\r\nb ', displayCode: 'a b'},
    ])
  })

  it('requires an equal or longer closing fence of the same kind', () => {
    expect(parseCodeRegions('````js\n```\n~~~\n````')).toEqual([
      {
        type: 'block',
        start: 0,
        end: 19,
        code: '```\n~~~\n',
        displayCode: '```\n~~~\n',
        lang: 'js',
      },
    ])
  })

  it('does not close a tilde fence with backticks', () => {
    expect(parseCodeRegions('~~~\n```\n~~~')[0]).toMatchObject({
      type: 'block',
      code: '```\n',
    })
  })

  it.each(['    ', '\t', '     '])(
    'keeps an excessively indented closing fence %j in the payload',
    indentation => {
      expect(
        parseCodeRegions(`\`\`\`\na\n${indentation}\`\`\`\nb\n\`\`\``),
      ).toEqual([
        {
          type: 'block',
          start: 0,
          end: 15 + indentation.length,
          code: `a\n${indentation}\`\`\`\nb\n`,
          displayCode: `a\n${indentation}\`\`\`\nb\n`,
        },
      ])
    },
  )

  it.each(['    ', '\t'])(
    'leaves an indented opening fence %j as original prose',
    indentation => {
      const richText = new RichTextAPI({
        text: `${indentation}\`\`\`\nx\n${indentation}\`\`\``,
      })
      expect(parseCodeRegions(richText.text)).toEqual([])
      expect(segmentRichTextCode(richText).filteredRichText).toBe(richText)
    },
  )

  it.each([
    {source: '> ```\n> a\n>     ```\n> b\n> ```', code: 'a\n    ```\nb\n'},
    {source: '- ```\n  a\n      ```\n  b\n  ```', code: 'a\n    ```\nb\n'},
  ])(
    'applies the closing-indent constraint inside containers',
    ({source, code}) => {
      expect(parseCodeRegions(source)[0]).toMatchObject({
        type: 'block',
        code,
        displayCode: code,
      })
    },
  )

  it('leaves escaped inline delimiters and ordinary prose escapes unchanged', () => {
    const text = '\\`x\\` and `y`'
    const {segments, filteredRichText} = segmentRichTextCode(
      new RichTextAPI({text}),
    )
    expect(filteredRichText.text).toBe(text)
    expect(segments[0]).toMatchObject({richText: {text: '\\`x\\` and '}})
    expect(segments[1]).toMatchObject({
      type: 'inline',
      start: 10,
      end: 13,
      code: 'y',
    })
  })

  it('handles doubled backticks containing literal single backticks', () => {
    expect(parseCodeRegions('`` @bsky.app `x` ``')).toEqual([
      {
        type: 'inline',
        start: 0,
        end: 19,
        code: ' @bsky.app `x` ',
        displayCode: '@bsky.app `x`',
      },
    ])
  })

  it('keeps all-space inline content and unmatched delimiters literal', () => {
    expect(parseCodeRegions('`   ` and `unclosed')).toEqual([
      {type: 'inline', start: 0, end: 5, code: '   ', displayCode: '   '},
    ])
  })

  it('does not turn other Markdown into code or alter surrounding prose', () => {
    const text =
      '# heading **bold** &amp; [link](https://example.com)\n\n    indented'
    expect(parseCodeRegions(text)).toEqual([])
    const richText = new RichTextAPI({text})
    expect(segmentRichTextCode(richText).filteredRichText).toBe(richText)
  })

  it('keeps multiple block and inline regions in source order', () => {
    expect(parseCodeRegions('`a`\n```js\nb\n```\n~~~\nc\n~~~')).toEqual([
      {type: 'inline', start: 0, end: 3, code: 'a', displayCode: 'a'},
      {
        type: 'block',
        start: 4,
        end: 15,
        code: 'b\n',
        displayCode: 'b\n',
        lang: 'js',
      },
      {type: 'block', start: 16, end: 25, code: 'c\n', displayCode: 'c\n'},
    ])
  })

  it('consumes quote prefixes on delimiter lines and reconstructs the payload', () => {
    const text = '> ```js\n> x  \n> \n> ```\nprose'
    const result = segmentRichTextCode(new RichTextAPI({text}))
    expect(result.segments[0]).toMatchObject({
      type: 'block',
      start: 0,
      end: 22,
      code: 'x  \n\n',
    })
    expect(result.segments[1]).toMatchObject({richText: {text: '\nprose'}})
  })

  it('consumes list prefixes and structural indentation', () => {
    expect(parseCodeRegions('- ```\n  x\n  ```')).toEqual([
      {type: 'block', start: 0, end: 15, code: 'x\n', displayCode: 'x\n'},
    ])
  })

  it('serializes a partially structural tab as equivalent remaining spaces', () => {
    expect(parseCodeRegions('  ```\n\tx\n  ```')[0]).toMatchObject({
      code: '  x\n',
      displayCode: '  x\n',
    })
  })

  it('preserves genuine indentation and CRLF inside a quoted list fence', () => {
    const text = '> - ```js\r\n>       value  \r\n>       \r\n>   ```'
    expect(parseCodeRegions(text)).toEqual([
      {
        type: 'block',
        start: 0,
        end: 45,
        code: '    value  \r\n    \r\n',
        displayCode: '    value  \r\n    \r\n',
        lang: 'js',
      },
    ])
  })

  it('accounts for the parser preprocessor removing an initial BOM', () => {
    expect(parseCodeRegions('\uFEFFbefore `x`')).toEqual([
      {type: 'inline', start: 10, end: 13, code: 'x', displayCode: 'x'},
    ])
  })

  it.each([
    ['ja&#118;ascript', 'javascript'],
    ['p\\+y', 'p+y'],
    ['世界', '世界'],
  ])(
    'uses the recognized info label %j without changing the body',
    (info, lang) => {
      expect(
        parseCodeRegions(`\`\`\`${info}\r\na\\b &amp;\r\n\`\`\``)[0],
      ).toMatchObject({
        lang,
        code: 'a\\b &amp;\r\n',
        displayCode: 'a\\b &amp;\r\n',
      })
    },
  )

  it.each([
    ['` \na\n `', ' \na\n ', ' a '],
    ['` \t `', ' \t ', '\t'],
    ['`\r\n`', '\r\n', ' '],
    ['`\u0000\uFFFD`', '\u0000\uFFFD', '\uFFFD\uFFFD'],
  ])(
    'keeps raw inline payload %j while applying display normalization',
    (text, code, displayCode) => {
      expect(parseCodeRegions(text)[0]).toMatchObject({
        type: 'inline',
        code,
        displayCode,
      })
    },
  )

  it('does not join inline delimiters across a blank paragraph boundary', () => {
    expect(parseCodeRegions('`\n\n`')).toEqual([])
  })

  it.each([
    {text: '> ```\n> a\nb', end: 9},
    {text: '- ```\n  a\nb', end: 9},
  ])(
    'ends an unclosed container fence before unprefixed prose',
    ({text, end}) => {
      const {segments} = segmentRichTextCode(new RichTextAPI({text}))
      expect(segments[0]).toMatchObject({
        type: 'block',
        start: 0,
        end,
        code: 'a',
      })
      expect(segments[1]).toMatchObject({richText: {text: '\nb'}})
    },
  )

  it('recognizes inline code in lazy quote prose while consuming only fence-line prefixes', () => {
    const text = '> prose\nlazy `x`\n> ```\n> y\n> ```'
    expect(parseCodeRegions(text)).toEqual([
      {type: 'inline', start: 13, end: 16, code: 'x', displayCode: 'x'},
      {type: 'block', start: 17, end: 32, code: 'y\n', displayCode: 'y\n'},
    ])
  })

  it.each([
    {text: '1. outer\n   - ```js\n     x\n     ```', start: 9, code: 'x\n'},
    {text: '> - ```\n>   \tx\n>   ```', start: 0, code: '\tx\n'},
  ])(
    'preserves genuine body indentation in nested containers',
    ({text, start, code}) => {
      expect(parseCodeRegions(text)[0]).toMatchObject({
        type: 'block',
        start,
        code,
        displayCode: code,
      })
    },
  )

  it('treats a closing fence with non-whitespace suffix as code content', () => {
    expect(parseCodeRegions('```\na\n``` extra\nb\n```')[0]).toMatchObject({
      code: 'a\n``` extra\nb\n',
      displayCode: 'a\n``` extra\nb\n',
    })
  })
})

describe('segmentRichTextCode', () => {
  it('preserves the original mention and SDK prose segmentation', () => {
    const richText = new RichTextAPI({
      text: originalPost,
      facets: [mention(7, 16)],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    expect(segments.map(segment => segment.type)).toEqual(['text', 'block'])
    if (segments[0].type !== 'text') throw new Error('Expected prose')
    expect(
      [...segments[0].richText.segments()].map(segment => segment.text),
    ).toEqual([
      'Hey yo ',
      '@bsky.app',
      ' you should render embedded code blocks in our posts:\n\n',
    ])
    expect(filteredRichText.text).toBe(originalPost)
    expect(filteredRichText.facets).toEqual(richText.facets)
  })

  it('rebases surviving Unicode facets after a code region', () => {
    const richText = new RichTextAPI({
      text: '`x` 👋 @bsky.app',
      facets: [mention(9, 18)],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    if (segments[1].type !== 'text') throw new Error('Expected prose')
    expect(segments[1].richText.text).toBe(' 👋 @bsky.app')
    expect(segments[1].richText.facets).toEqual([mention(6, 15)])
    expect(filteredRichText.facets).toEqual([mention(9, 18)])
  })

  it.each([
    {name: 'inside', start: 3, end: 4},
    {name: 'crossing opening', start: 0, end: 4},
    {name: 'crossing closing', start: 3, end: 7},
    {name: 'containing code', start: 0, end: 7},
    {name: 'opening delimiter', start: 2, end: 3},
  ])('suppresses the whole facet $name', ({start, end}) => {
    const richText = new RichTextAPI({
      text: 'a `b` c',
      facets: [mention(start, end)],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    expect(filteredRichText.facets).toEqual([])
    expect(
      segments
        .filter(segment => segment.type === 'text')
        .flatMap(segment => segment.richText.facets ?? []),
    ).toEqual([])
  })

  it('preserves facets merely touching either code boundary', () => {
    const richText = new RichTextAPI({
      text: 'a `b` c',
      facets: [mention(0, 2), mention(5, 7)],
    })
    expect(segmentRichTextCode(richText).filteredRichText.facets).toEqual(
      richText.facets,
    )
  })

  it('suppresses mention facets on the fenced language header', () => {
    const richText = new RichTextAPI({
      text: '```@bsky.app\nx\n```',
      facets: [mention(3, 12)],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    expect(segments[0]).toMatchObject({type: 'block', lang: '@bsky.app'})
    expect(filteredRichText.facets).toEqual([])
  })

  it('does not revive a facet the SDK suppresses for overlapping an earlier facet', () => {
    const richText = new RichTextAPI({
      text: 'a `b` c',
      facets: [mention(0, 4), mention(1, 2)],
    })
    expect(segmentRichTextCode(richText).filteredRichText.facets).toEqual([])
  })

  it('keeps links inside code literal without shortening or splitting blocks', () => {
    const code = 'https://example.com/a/long/path?q=1'
    const richText = new RichTextAPI({
      text: `\`\`\`\n${code}\n\`\`\``,
      facets: [
        {
          index: {byteStart: 4, byteEnd: 4 + code.length},
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: code,
            },
          ],
        },
      ],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({type: 'block', code: `${code}\n`})
    expect(filteredRichText.facets).toEqual([])
  })

  it('rejects invalid byte bounds and positions inside a UTF-8 sequence', () => {
    const richText = new RichTextAPI({
      text: '👋 @bsky.app `x`',
      facets: [
        mention(-1, 4),
        mention(1, 4),
        mention(5, 99),
        mention(5, 5),
        mention(5, 14),
      ],
    })
    expect(segmentRichTextCode(richText).filteredRichText.facets).toEqual([
      mention(5, 14),
    ])
  })

  it('returns the exact original SDK instance for inputs without code', () => {
    const richText = new RichTextAPI({
      text: '👋 @bsky.app',
      facets: [mention(5, 14)],
    })
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    expect(filteredRichText).toBe(richText)
    expect(segments).toEqual([{type: 'text', richText}])
    expect(segments[0].type === 'text' && segments[0].richText).toBe(richText)
  })

  it('does not mutate source facets when filtered or rebased output is edited', () => {
    const richText = new RichTextAPI({
      text: '`x` @bsky.app',
      facets: [mention(4, 13)],
    })
    const original = richText.clone()
    const {segments, filteredRichText} = segmentRichTextCode(richText)
    filteredRichText.insert(0, '!')
    if (segments[1].type !== 'text') throw new Error('Expected prose')
    segments[1].richText.insert(0, '!!')
    expect(richText.text).toBe(original.text)
    expect(richText.facets).toEqual(original.facets)
  })

  it.each([
    [-1, 4],
    [0.5, 4],
    [0, 1.5],
    [0, Infinity],
    [Infinity, Infinity],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    [NaN, 4],
    [0, NaN],
    [0, 0],
    [0, 1],
  ])(
    'rejects malformed bounds [%p,%p) without hiding a valid outside facet',
    (start, end) => {
      const source = new RichTextAPI({
        text: '👋 @bsky.app `x`',
        facets: [mention(start, end), mention(5, 14)],
      })
      expect(segmentRichTextCode(source).filteredRichText.facets).toEqual([
        mention(5, 14),
      ])
    },
  )

  it('preserves all features and SDK getter precedence on an outside facet', () => {
    const facet: Facet = {
      ...mention(0, 9),
      features: [
        {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
        ...mention(0, 9).features,
      ],
    }
    const source = new RichTextAPI({text: '@bsky.app `x`', facets: [facet]})
    const reference = [...source.segments()][0]
    const {segments, filteredRichText} = segmentRichTextCode(source)
    expect(filteredRichText.facets).toEqual([facet])
    if (segments[0].type !== 'text') throw new Error('Expected prose')
    const actual = [...segments[0].richText.segments()][0]
    expect(actual.link).toEqual(reference.link)
    expect(actual.mention).toEqual(reference.mention)
  })

  it('preserves SDK overlap precedence when an earlier facet covers only whitespace', () => {
    const source = new RichTextAPI({
      text: 'a \t @bsky.app `x`',
      facets: [mention(1, 4), mention(2, 13), mention(4, 13)],
    })
    const reference = [...source.segments()].flatMap(segment =>
      segment.facet ? [segment.facet] : [],
    )
    expect(reference).toEqual([mention(4, 13)])
    expect(segmentRichTextCode(source).filteredRichText.facets).toEqual(
      reference,
    )
  })

  it('preserves a BOM at the start of prose after code and its facet byte offsets', () => {
    const source = new RichTextAPI({
      text: '`x`\uFEFF @bsky.app',
      facets: [mention(7, 16)],
    })
    const {segments} = segmentRichTextCode(source)
    if (segments[1].type !== 'text') throw new Error('Expected prose')
    expect(segments[1].richText.text).toBe('\uFEFF @bsky.app')
    expect(segments[1].richText.facets).toEqual([mention(4, 13)])
    expect(
      [...segments[1].richText.segments()].find(segment => segment.mention)
        ?.text,
    ).toBe('@bsky.app')
  })

  it('preserves source, Copy and facet byte coordinates across seeded Unicode cases', () => {
    const unicodeCases = [
      '👩🏽‍💻',
      'e\u0301',
      'é',
      '𝟘',
      '🇺🇸',
      '✈️',
      'אבג\u202E',
      '\u2066العربية\u2069',
      '\uFEFF',
      '\u0000\uFFFD',
    ]
    const chunks = [
      ...unicodeCases,
      '\t ',
      '\r',
      '\n',
      '\r\n',
      '&amp;',
      '\\*',
      '``',
    ]
    const encoder = new TextEncoder()
    let seed = 0x31415926
    for (let iteration = 0; iteration < 120; iteration++) {
      const prefix = unicodeCases[iteration % unicodeCases.length]
      const suffix = unicodeCases[(iteration + 3) % unicodeCases.length]
      let payload = 'payload:'
      for (let chunk = 0; chunk < 6; chunk++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        payload += chunks[seed % chunks.length]
      }
      const ending = ['\n', '\r', '\r\n'][iteration % 3]
      const fence = '`'.repeat(16)
      const before = `${prefix} @before.test${ending}`
      const header = `${fence}js${ending}`
      const after = `${ending}${suffix} @after.test`
      const text = `${before}${header}${payload}${ending}${fence}${after}`
      const codeStart = encoder.encode(before + header).length
      const codeEnd = codeStart + encoder.encode(payload).length
      const beforeStart = encoder.encode(prefix + ' ').length
      const afterStart = encoder.encode(
        before + header + payload + ending + fence + ending + suffix + ' ',
      ).length
      const facets = [
        mention(beforeStart, beforeStart + 12),
        mention(codeStart, codeEnd),
        mention(afterStart, afterStart + 11),
      ]
      const source = new RichTextAPI({text, facets})
      const original = source.clone()
      const {segments, filteredRichText} = segmentRichTextCode(source)
      const regions = segments.filter(segment => segment.type !== 'text')
      expect(regions).toHaveLength(1)
      expect(regions[0]).toMatchObject({
        start: encoder.encode(before).length,
        end: encoder.encode(before + header + payload + ending + fence).length,
        code: payload + ending,
      })
      expect(filteredRichText.facets).toEqual([facets[0], facets[2]])
      const prose = segments.filter(segment => segment.type === 'text')
      expect(
        prose.map(
          segment =>
            [...segment.richText.segments()].find(part => part.mention)?.text,
        ),
      ).toEqual(['@before.test', '@after.test'])
      expect(prose[1].richText.facets?.[0].index).toEqual({
        byteStart: encoder.encode(ending + suffix + ' ').length,
        byteEnd: encoder.encode(ending + suffix + ' @after.test').length,
      })
      expect(source.text).toBe(original.text)
      expect(source.facets).toEqual(original.facets)
    }
  })

  it('keeps mixed regions ordered, disjoint and on original UTF-8 boundaries', () => {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder('utf-8', {ignoreBOM: true})
    const prefixes = [
      '👩🏽‍💻',
      'e\u0301',
      'é',
      '🇺🇸',
      '\uFEFF',
      '\u2066אבג\u2069',
      '\u0000\uFFFD',
    ]
    for (let iteration = 0; iteration < 35; iteration++) {
      const prefix = prefixes[iteration % prefixes.length]
      const ticks = '`'.repeat(1 + (iteration % 5))
      const ending = ['\n', '\r', '\r\n'][iteration % 3]
      const marker = '~'.repeat(3 + (iteration % 3))
      const before = `${prefix} @before.test `
      const first = `${ticks} ${prefix} ${ticks}`
      const payload = `\t${prefix}  ${ending}`
      const block = `${marker}js${ending}${payload}${marker}`
      const after = `${ending}@after.test `
      const last = `${ticks}last${ticks}`
      const text = before + first + ending + block + after + last
      const offset = (value: string) => encoder.encode(value).length
      const beforeFacet = mention(
        offset(prefix + ' '),
        offset(prefix + ' @before.test'),
      )
      const afterStart = offset(before + first + ending + block + ending)
      const source = new RichTextAPI({
        text,
        facets: [beforeFacet, mention(afterStart, afterStart + 11)],
      })
      const {segments, filteredRichText} = segmentRichTextCode(source)
      const regions = segments.filter(segment => segment.type !== 'text')
      expect(
        regions.map(region => ({
          type: region.type,
          start: region.start,
          end: region.end,
          code: region.code,
        })),
      ).toEqual([
        {
          type: 'inline',
          start: offset(before),
          end: offset(before + first),
          code: ` ${prefix} `,
        },
        {
          type: 'block',
          start: offset(before + first + ending),
          end: offset(before + first + ending + block),
          code: payload,
        },
        {
          type: 'inline',
          start: offset(before + first + ending + block + after),
          end: offset(text),
          code: 'last',
        },
      ])
      const bytes = encoder.encode(text)
      let previousEnd = 0
      for (const region of regions) {
        expect(region.start).toBeGreaterThanOrEqual(previousEnd)
        expect(bytes[region.start] & 0xc0).not.toBe(0x80)
        if (region.end < bytes.length)
          expect(bytes[region.end] & 0xc0).not.toBe(0x80)
        previousEnd = region.end
      }
      expect(
        segments
          .map(segment =>
            segment.type === 'text'
              ? segment.richText.text
              : decoder.decode(bytes.subarray(segment.start, segment.end)),
          )
          .join(''),
      ).toBe(text)
      expect(filteredRichText.facets).toEqual(source.facets)
      expect(
        segments
          .filter(segment => segment.type === 'text')
          .flatMap(segment =>
            [...segment.richText.segments()]
              .filter(part => part.mention)
              .map(part => part.text),
          ),
      ).toEqual(['@before.test', '@after.test'])
    }
  })
})
