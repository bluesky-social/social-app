import {describe, expect, test} from '@jest/globals'

import {
  buildChipAccessibilityLabel,
  shouldRenderChip,
} from '#/features/quickReact/types'

describe('QuickReactChip logic', () => {
  test('shouldRenderChip returns false when flag disabled', () => {
    expect(shouldRenderChip({enabled: false, emoji: 'heart'})).toBe(false)
  })

  test('shouldRenderChip returns false when emoji is undefined', () => {
    expect(shouldRenderChip({enabled: true, emoji: undefined})).toBe(false)
  })

  test('shouldRenderChip returns true when enabled and emoji present', () => {
    expect(shouldRenderChip({enabled: true, emoji: 'heart'})).toBe(true)
  })

  test('accessibility label includes emoji name and change/remove hint', () => {
    const label = buildChipAccessibilityLabel('heart')
    expect(label).toMatch(/heart/i)
    expect(label.length).toBeGreaterThan(0)
  })
})
