import {describe, expect, it} from '@jest/globals'

import {getInviteTheme, INVITE_THEME_KEYS, INVITE_THEMES} from './themes'

describe('invite themes', () => {
  it('exposes four themes in canonical order', () => {
    expect(INVITE_THEME_KEYS).toEqual(['dawn', 'day', 'dusk', 'night'])
  })

  it('has light and dark variants for every theme', () => {
    for (const key of INVITE_THEME_KEYS) {
      const theme = INVITE_THEMES[key]
      expect(theme.light.qrPrimary).toMatch(/^#/)
      expect(theme.dark.qrPrimary).toMatch(/^#/)
      expect(theme.swatch).toMatch(/^#/)
    }
  })

  it('getInviteTheme returns the requested theme', () => {
    expect(getInviteTheme('day').swatch).toBe(INVITE_THEMES.day.swatch)
    expect(getInviteTheme('night').swatch).toBe(INVITE_THEMES.night.swatch)
  })

  it('getInviteTheme falls back to day for unknown keys', () => {
    // @ts-expect-error testing runtime fallback
    expect(getInviteTheme('mystery').swatch).toBe(INVITE_THEMES.day.swatch)
  })
})
