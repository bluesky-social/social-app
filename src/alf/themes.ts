import {
  createThemes as baseCreateThemes,
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
} from '@bsky.app/alf'

const themes = baseCreateThemes({
  defaultPalette: DEFAULT_PALETTE,
  subduedPalette: DEFAULT_SUBDUED_PALETTE,
})

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = themes.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = themes.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = themes.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = themes.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = themes.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = themes.dim

export const defaultTheme = themes.light

export function createThemes() {
  const themes = baseCreateThemes({
    defaultPalette: DEFAULT_PALETTE,
    subduedPalette: DEFAULT_SUBDUED_PALETTE,
  })

  return {
    lightPalette: themes.light.palette,
    darkPalette: themes.dark.palette,
    dimPalette: themes.dim.palette,
    light: themes.light,
    dark: themes.dark,
    dim: themes.dim,
  }
}
