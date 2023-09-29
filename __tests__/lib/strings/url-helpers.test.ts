import {
  linkRequiresWarning,
  isPossiblyAUrl,
} from '../../../src/lib/strings/url-helpers'

describe('linkRequiresWarning', () => {
  type Case = [string, string, boolean]
  const cases: Case[] = [
    ['http://example.com', '', true],
    ['http://example.com', 'http://example.com', false],
    ['http://example.com', 'example.com', false],
    ['http://example.com', 'other.com', true],
    ['http://example.com', 'http://other.com', true],
    ['http://example.com', 'some label', true],

    // bad uri inputs, default to true
    ['', '', true],
    ['example.com', 'example.com', true],
  ]

  it.each(cases)(
    'given input uri %p and text %p, returns %p',
    (uri, text, expected) => {
      const output = linkRequiresWarning(uri, text)
      expect(output).toEqual(expected)
    },
  )
})

describe('isPossiblyAUrl', () => {
  type Case = [string, boolean]
  const cases: Case[] = [
    ['', false],
    ['text', false],
    ['some text', false],
    ['some text', false],
    ['some domain.com', false],
    ['domain.com', true],
    [' domain.com', true],
    ['domain.com ', true],
    [' domain.com ', true],
    ['http://domain.com', true],
    [' http://domain.com', true],
    ['http://domain.com ', true],
    [' http://domain.com ', true],
    ['https://domain.com', true],
    [' https://domain.com', true],
    ['https://domain.com ', true],
    [' https://domain.com ', true],
    ['http://domain.com/foo', true],
    ['http://domain.com stuff', true],
  ]

  it.each(cases)('given input uri %p, returns %p', (str, expected) => {
    const output = isPossiblyAUrl(str)
    expect(output).toEqual(expected)
  })
})
