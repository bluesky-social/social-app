import {describe, expect, it} from '@jest/globals'

import {resolveAndroidHaptic} from '#/lib/haptics/android'

describe('resolveAndroidHaptic', () => {
  it('returns constants that exist on every supported API level as-is', () => {
    expect(resolveAndroidHaptic('long-press', 24)).toBe('long-press')
    expect(resolveAndroidHaptic('context-click', 24)).toBe('context-click')
    expect(resolveAndroidHaptic('clock-tick', 24)).toBe('clock-tick')
  })

  it('returns newer constants as-is once they exist', () => {
    expect(resolveAndroidHaptic('confirm', 30)).toBe('confirm')
    expect(resolveAndroidHaptic('toggle-on', 34)).toBe('toggle-on')
    expect(resolveAndroidHaptic('drag-start', 36)).toBe('drag-start')
  })

  it('falls back to an older equivalent below the minimum API level', () => {
    expect(resolveAndroidHaptic('confirm', 29)).toBe('virtual-key')
    expect(resolveAndroidHaptic('reject', 29)).toBe('long-press')
    expect(resolveAndroidHaptic('toggle-on', 33)).toBe('context-click')
    expect(resolveAndroidHaptic('toggle-off', 33)).toBe('clock-tick')
    expect(resolveAndroidHaptic('segment-tick', 30)).toBe('context-click')
    expect(resolveAndroidHaptic('drag-start', 33)).toBe('long-press')
    expect(resolveAndroidHaptic('keyboard-press', 26)).toBe('keyboard-tap')
  })

  it('returns null when there is nothing equivalent to fall back to', () => {
    expect(resolveAndroidHaptic('keyboard-release', 26)).toBeNull()
    expect(resolveAndroidHaptic('no-haptics', 33)).toBeNull()
  })
})
