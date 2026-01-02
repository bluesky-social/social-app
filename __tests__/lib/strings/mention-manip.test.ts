import {
  getMentionAt,
  insertMentionAt,
} from '../../../src/lib/strings/mention-manip'

describe('getMentionAt', () => {
  type Case = [string, number, string | undefined]
  const cases: Case[] = [
    ['hello @alice goodbye', 0, undefined],
    ['hello @alice goodbye', 1, undefined],
    ['hello @alice goodbye', 2, undefined],
    ['hello @alice goodbye', 3, undefined],
    ['hello @alice goodbye', 4, undefined],
    ['hello @alice goodbye', 5, undefined],
    ['hello @alice goodbye', 6, 'alice'],
    ['hello @alice goodbye', 7, 'alice'],
    ['hello @alice goodbye', 8, 'alice'],
    ['hello @alice goodbye', 9, 'alice'],
    ['hello @alice goodbye', 10, 'alice'],
    ['hello @alice goodbye', 11, 'alice'],
    ['hello @alice goodbye', 12, 'alice'],
    ['hello @alice goodbye', 13, undefined],
    ['hello @alice goodbye', 14, undefined],
    ['@alice', 0, 'alice'],
    ['@alice hello', 0, 'alice'],
    ['@alice hello', 1, 'alice'],
    ['@alice hello', 2, 'alice'],
    ['@alice hello', 3, 'alice'],
    ['@alice hello', 4, 'alice'],
    ['@alice hello', 5, 'alice'],
    ['@alice hello', 6, 'alice'],
    ['@alice hello', 7, undefined],
    ['alice@alice', 0, undefined],
    ['alice@alice', 6, undefined],
    ['hello @alice-com goodbye', 8, 'alice-com'],
  ]

  it.each(cases)(
    'given input string %p and cursor position %p, returns %p',
    (str, cursorPos, expected) => {
      const output = getMentionAt(str, cursorPos)
      expect(output?.value).toEqual(expected)
    },
  )
})

describe('insertMentionAt', () => {
  type Case = [string, number, string]
  const cases: Case[] = [
    ['hello @alice goodbye', 0, 'hello @alice goodbye'],
    ['hello @alice goodbye', 1, 'hello @alice goodbye'],
    ['hello @alice goodbye', 2, 'hello @alice goodbye'],
    ['hello @alice goodbye', 3, 'hello @alice goodbye'],
    ['hello @alice goodbye', 4, 'hello @alice goodbye'],
    ['hello @alice goodbye', 5, 'hello @alice goodbye'],
    ['hello @alice goodbye', 6, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 7, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 8, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 9, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 10, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 11, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 12, 'hello @alice.com  goodbye'],
    ['hello @alice goodbye', 13, 'hello @alice goodbye'],
    ['hello @alice goodbye', 14, 'hello @alice goodbye'],
    ['@alice', 0, '@alice.com '],
    ['@alice hello', 0, '@alice.com  hello'],
    ['@alice hello', 1, '@alice.com  hello'],
    ['@alice hello', 2, '@alice.com  hello'],
    ['@alice hello', 3, '@alice.com  hello'],
    ['@alice hello', 4, '@alice.com  hello'],
    ['@alice hello', 5, '@alice.com  hello'],
    ['@alice hello', 6, '@alice.com  hello'],
    ['@alice hello', 7, '@alice hello'],
    ['alice@alice', 0, 'alice@alice'],
    ['alice@alice', 6, 'alice@alice'],
    ['hello @alice-com goodbye', 10, 'hello @alice.com  goodbye'],
  ]

  it.each(cases)(
    'given input string %p and cursor position %p, returns %p',
    (str, cursorPos, expected) => {
      const output = insertMentionAt(str, cursorPos, 'alice.com')
      expect(output).toEqual(expected)
    },
  )
})
