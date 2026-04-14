import {describe, expect, test} from '@jest/globals'

import {
  getEmojiGlyph,
  getPickerRowLabelKey,
  getRemoveRowLabelKey,
  REACTION_EMOJIS,
} from '#/features/quickReact/types'

describe('QuickReactPicker helpers', () => {
  test('every emoji maps to a glyph', () => {
    for (const e of REACTION_EMOJIS) {
      expect(getEmojiGlyph(e)).toBeTruthy()
    }
  })

  test('distinct emojis map to distinct glyphs', () => {
    const glyphs = REACTION_EMOJIS.map(getEmojiGlyph)
    expect(new Set(glyphs).size).toBe(glyphs.length)
  })

  test('every emoji has a localizable label key', () => {
    for (const e of REACTION_EMOJIS) {
      const k = getPickerRowLabelKey(e)
      expect(typeof k).toBe('string')
      expect(k.length).toBeGreaterThan(0)
    }
  })

  test('remove row has a dedicated label key', () => {
    expect(getRemoveRowLabelKey()).toBeTruthy()
  })
})
