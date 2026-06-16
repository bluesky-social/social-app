import {describe, expect, it} from '@jest/globals'

import {
  highlightToLines,
  languageFromFilename,
  languageFromName,
} from './highlight'

describe('languageFromName', () => {
  it('maps an extension alias to a language', () => {
    expect(languageFromName('ts')).toBe('typescript')
    expect(languageFromName('py')).toBe('python')
    expect(languageFromName('sh')).toBe('bash')
  })

  it('passes through a full language name', () => {
    expect(languageFromName('typescript')).toBe('typescript')
    expect(languageFromName('python')).toBe('python')
  })

  it('is case-insensitive and trims', () => {
    expect(languageFromName('  TS ')).toBe('typescript')
    expect(languageFromName('Python')).toBe('python')
  })

  it('returns undefined for unknown or empty input', () => {
    expect(languageFromName('not-a-language')).toBeUndefined()
    expect(languageFromName('')).toBeUndefined()
    expect(languageFromName('   ')).toBeUndefined()
    expect(languageFromName(undefined)).toBeUndefined()
  })
})

describe('languageFromFilename', () => {
  it('maps a filename extension to a language', () => {
    expect(languageFromFilename('main.ts')).toBe('typescript')
    expect(languageFromFilename('app.py')).toBe('python')
  })

  it('returns undefined when there is no usable extension', () => {
    expect(languageFromFilename('Makefile')).toBeUndefined()
    expect(languageFromFilename('file.unknownext')).toBeUndefined()
    expect(languageFromFilename(undefined)).toBeUndefined()
  })
})

describe('highlightToLines', () => {
  it('splits into one entry per line', () => {
    expect(highlightToLines('a\nb\nc', 'text')).toHaveLength(3)
  })

  it('normalizes CRLF so no stray carriage return survives', () => {
    const lines = highlightToLines('a\r\nb', 'typescript')
    expect(lines).toHaveLength(2)
    const text = lines
      .map(line => line.map(span => span.value).join(''))
      .join('\n')
    expect(text).not.toContain('\r')
  })
})
