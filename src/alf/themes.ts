import {createThemes} from '@bsky.app/alf'

import {getActiveBrand} from '#/brand/activeBrand'

const brand = getActiveBrand()

// The light theme comes from the light ramps. The dark and dim themes come
// from the optional pre-inversion dark sources when a brand supplies them
// (createThemes inverts internally via invertPalette), falling back to the
// light ramps otherwise. Without this, dark/dim would be a naive inversion of
// the light ramp, which produces poor contrast for brands whose light and dark
// ramps are not simple mirror images. See `src/brand/types.ts` palette docs.
const LIGHT_THEMES = createThemes({
  defaultPalette: brand.palette.default,
  subduedPalette: brand.palette.subdued,
})
const DARK_THEMES = createThemes({
  defaultPalette: brand.palette.defaultDark ?? brand.palette.default,
  subduedPalette: brand.palette.subduedDark ?? brand.palette.subdued,
})

const BRAND_THEMES = {
  light: LIGHT_THEMES.light,
  dark: DARK_THEMES.dark,
  dim: DARK_THEMES.dim,
}

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
