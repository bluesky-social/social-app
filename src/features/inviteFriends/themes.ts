/**
 * Color themes for the Invite Friends share sheet (APP-2142).
 *
 * Each theme has a light + dark pair. The QR halo / card border use the
 * matching primary color; the QR data uses qrPrimary; the avatar handle text
 * follows handleColor.
 */
export type InviteThemeKey = 'dawn' | 'day' | 'dusk' | 'night'

export type InviteThemeVariant = {
  /** QR data + eye color */
  qrPrimary: string
  /** Card top-to-bottom gradient start (top) */
  gradientFrom: string
  /** Card top-to-bottom gradient end (bottom) */
  gradientTo: string
  /** Card drop-shadow color (opaque hex; opacity handled separately) */
  shadowColor: string
  /** Handle label rendered under the QR (typically white) */
  handleColor: string
}

export type InviteTheme = {
  key: InviteThemeKey
  /** Color shown in the theme picker dot */
  swatch: string
  light: InviteThemeVariant
  dark: InviteThemeVariant
}

export const INVITE_THEME_KEYS: readonly InviteThemeKey[] = [
  'dawn',
  'day',
  'dusk',
  'night',
] as const

export const INVITE_THEMES: Record<InviteThemeKey, InviteTheme> = {
  dawn: {
    key: 'dawn',
    swatch: '#ff6dbe',
    light: {
      qrPrimary: '#ff6dbe',
      gradientFrom: '#a8ccff',
      gradientTo: '#ff6dbe',
      shadowColor: '#ff6dbe',
      handleColor: '#ffffff',
    },
    dark: {
      qrPrimary: '#ff6dbe',
      gradientFrom: '#a8ccff',
      gradientTo: '#ff6dbe',
      shadowColor: '#ff6dbe',
      handleColor: '#ffffff',
    },
  },
  day: {
    key: 'day',
    swatch: '#006aff',
    light: {
      qrPrimary: '#006aff',
      gradientFrom: '#006aff',
      gradientTo: '#75afff',
      shadowColor: '#006aff',
      handleColor: '#ffffff',
    },
    dark: {
      qrPrimary: '#006aff',
      gradientFrom: '#006aff',
      gradientTo: '#75afff',
      shadowColor: '#006aff',
      handleColor: '#ffffff',
    },
  },
  dusk: {
    key: 'dusk',
    swatch: '#f88f47',
    light: {
      qrPrimary: '#f88f47',
      gradientFrom: '#f88f47',
      gradientTo: '#b15aa2',
      shadowColor: '#f88f47',
      handleColor: '#ffffff',
    },
    dark: {
      qrPrimary: '#f88f47',
      gradientFrom: '#f88f47',
      gradientTo: '#b15aa2',
      shadowColor: '#f88f47',
      handleColor: '#ffffff',
    },
  },
  night: {
    key: 'night',
    swatch: '#0048ad',
    light: {
      qrPrimary: '#0048ad',
      gradientFrom: '#0048ad',
      gradientTo: '#001533',
      shadowColor: '#001533',
      handleColor: '#ffffff',
    },
    dark: {
      qrPrimary: '#0048ad',
      gradientFrom: '#0048ad',
      gradientTo: '#001533',
      shadowColor: '#001533',
      handleColor: '#ffffff',
    },
  },
}

export function getInviteTheme(key: InviteThemeKey): InviteTheme {
  return INVITE_THEMES[key] ?? INVITE_THEMES.day
}
