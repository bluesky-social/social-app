import {describe, expect, it} from '@jest/globals'

import {isRTLText} from '../text-direction'

describe('isRTLText', () => {
  it('recognizes right-to-left text', () => {
    expect(isRTLText('עברית')).toBe(true)
    expect(isRTLText('العربية')).toBe(true)
  })

  it('recognizes left-to-right text', () => {
    expect(isRTLText('English')).toBe(false)
  })

  it('uses the first strong directional character', () => {
    expect(isRTLText('  123 🦋 עברית English')).toBe(true)
    expect(isRTLText('  123 🦋 English עברית')).toBe(false)
  })

  it('defaults to left-to-right when there are no strong characters', () => {
    expect(isRTLText('123 🦋 ...')).toBe(false)
    expect(isRTLText('')).toBe(false)
  })
})
