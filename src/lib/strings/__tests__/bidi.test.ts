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

import {forceLTR} from '../bidi'

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
