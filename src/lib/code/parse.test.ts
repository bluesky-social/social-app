import {describe, expect, it} from '@jest/globals'

import {hasCode, parseCodeTokens} from './parse'

describe('parseCodeTokens', () => {
  it('returns a single text token for plain text', () => {
    expect(parseCodeTokens('hello world')).toEqual([
      {type: 'text', value: 'hello world'},
    ])
  })

  it('parses inline code', () => {
    expect(parseCodeTokens('run `npm test` now')).toEqual([
      {type: 'text', value: 'run '},
      {type: 'inline', value: 'npm test'},
      {type: 'text', value: ' now'},
    ])
  })

  it('treats a single-line triple fence as inline code', () => {
    expect(parseCodeTokens('see ```some code``` here')).toEqual([
      {type: 'text', value: 'see '},
      {type: 'inline', value: 'some code'},
      {type: 'text', value: ' here'},
    ])
  })

  it('parses a fenced block with a language', () => {
    expect(parseCodeTokens('```ts\nconst x = 1\n```')).toEqual([
      {type: 'fence', value: 'const x = 1', lang: 'ts'},
    ])
  })

  it('parses a fenced block without a language', () => {
    expect(parseCodeTokens('```\nplain\n```')).toEqual([
      {type: 'fence', value: 'plain', lang: undefined},
    ])
  })

  it('keeps surrounding text around a fenced block', () => {
    expect(parseCodeTokens('before\n```\ncode\n```\nafter')).toEqual([
      {type: 'text', value: 'before\n'},
      {type: 'fence', value: 'code', lang: undefined},
      {type: 'text', value: '\nafter'},
    ])
  })

  it('preserves multi-line bodies', () => {
    expect(parseCodeTokens('```js\na\nb\n```')).toEqual([
      {type: 'fence', value: 'a\nb', lang: 'js'},
    ])
  })

  it('accepts labels with non-word characters', () => {
    expect(parseCodeTokens('```c++\nint x;\n```')).toEqual([
      {type: 'fence', value: 'int x;', lang: 'c++'},
    ])
    expect(parseCodeTokens('```c#\nint x;\n```')).toEqual([
      {type: 'fence', value: 'int x;', lang: 'c#'},
    ])
  })

  it('trims trailing whitespace from the label', () => {
    expect(parseCodeTokens('```ts  \nconst x = 1\n```')).toEqual([
      {type: 'fence', value: 'const x = 1', lang: 'ts'},
    ])
  })

  it('leaves unmatched backticks as literal text', () => {
    expect(parseCodeTokens('a lone ` backtick')).toEqual([
      {type: 'text', value: 'a lone ` backtick'},
    ])
  })

  it('does not match empty inline code', () => {
    expect(parseCodeTokens('a `` b')).toEqual([{type: 'text', value: 'a `` b'}])
  })
})

describe('hasCode', () => {
  it('is false for plain text', () => {
    expect(hasCode('no code here')).toBe(false)
  })

  it('is true for inline code', () => {
    expect(hasCode('has `code`')).toBe(true)
  })

  it('is true for a fenced block', () => {
    expect(hasCode('```\ncode\n```')).toBe(true)
  })

  it('is repeatable (regex lastIndex is reset)', () => {
    expect(hasCode('has `code`')).toBe(true)
    expect(hasCode('has `code`')).toBe(true)
  })
})
