import {createThemes} from '@bsky.app/alf'

import {getActiveBrand} from '#/brand/activeBrand'

const brand = getActiveBrand()

const BRAND_THEMES = createThemes({
  defaultPalette: brand.palette.default,
  subduedPalette: brand.palette.subdued,
})

export const themes = {
  lightPalette: BRAND_THEMES.light.palette,
  darkPalette: BRAND_THEMES.dark.palette,
  dimPalette: BRAND_THEMES.dim.palette,
  light: BRAND_THEMES.light,
  dark: BRAND_THEMES.dark,
  dim: BRAND_THEMES.dim,
}

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = BRAND_THEMES.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = BRAND_THEMES.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = BRAND_THEMES.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = BRAND_THEMES.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = BRAND_THEMES.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = BRAND_THEMES.dim
