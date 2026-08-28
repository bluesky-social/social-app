import '@formatjs/intl-locale/polyfill-force.js'

import {describe, expect, it, jest} from '@jest/globals'

/*
 * bidi.ts reads IS_WEB at call time, so a getter lets each test pick the
 * platform. The mock-prefixed name is required by jest's factory scope rule.
 */
let mockIsWeb = false
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockIsWeb
  },
}))

import {forceLTR, isRTL} from '../bidi'

const LEFT_TO_RIGHT_EMBEDDING = '\u202A'
const POP_DIRECTIONAL_FORMATTING = '\u202C'

describe('forceLTR', () => {
  it('wraps the string in directional formatting characters on native', () => {
    mockIsWeb = false
    expect(forceLTR('@alice.bsky.social')).toBe(
      LEFT_TO_RIGHT_EMBEDDING +
        '@alice.bsky.social' +
        POP_DIRECTIONAL_FORMATTING,
    )
  })

  it('returns the string unchanged on web so copied text stays clean (#8451)', () => {
    mockIsWeb = true
    expect(forceLTR('@alice.bsky.social')).toBe('@alice.bsky.social')
  })
})

describe('isRTL', () => {
  it('uses the Intl.Locale implementation forced in production', () => {
    expect(Intl.Locale).toHaveProperty('polyfilled', true)
    expect(Intl.Locale.prototype).toHaveProperty('getTextInfo')
  })

  it('recognizes right-to-left languages and scripts', () => {
    expect(isRTL('he')).toBe(true)
    expect(isRTL('ar')).toBe(true)
    expect(isRTL('az-Arab')).toBe(true)
  })

  it('recognizes left-to-right languages and scripts', () => {
    expect(isRTL('en')).toBe(false)
    expect(isRTL('az-Latn')).toBe(false)
  })

  it('handles missing and invalid language tags', () => {
    expect(isRTL(undefined)).toBe(false)
    expect(isRTL('not_a_language')).toBe(false)
  })
})
