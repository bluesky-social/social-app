import {createThemes} from '@bsky.app/alf'

// Eurosky fork: palette is overridden in src/config/brand-theme.ts. This is
// one of only two upstream files that redirect into that module.
import {
  type AccentKey,
  BRAND_PALETTE,
  BRAND_SUBDUED_PALETTE,
  buildPalettes,
} from '#/config/brand-theme'

const DEFAULT_THEMES = createThemes({
  defaultPalette: BRAND_PALETTE,
  subduedPalette: BRAND_SUBDUED_PALETTE,
})

export const themes = {
  lightPalette: DEFAULT_THEMES.light.palette,
  darkPalette: DEFAULT_THEMES.dark.palette,
  dimPalette: DEFAULT_THEMES.dim.palette,
  light: DEFAULT_THEMES.light,
  dark: DEFAULT_THEMES.dark,
  dim: DEFAULT_THEMES.dim,
}

/**
 * Eurosky: build the {light, dark, dim} theme set for a given accent family, in
 * the same shape as `themes`. Used at runtime by the per-user accent picker
 * (fed to ALF via ThemeProvider `themesOverride`); the module-level `themes`
 * above is the DEFAULT_ACCENT build.
 */
export function buildThemes(accent: AccentKey): typeof themes {
  const {default: defaultPalette, subdued: subduedPalette} =
    buildPalettes(accent)
  const t = createThemes({defaultPalette, subduedPalette})
  return {
    lightPalette: t.light.palette,
    darkPalette: t.dark.palette,
    dimPalette: t.dim.palette,
    light: t.light,
    dark: t.dark,
    dim: t.dim,
  }
}

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = DEFAULT_THEMES.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = DEFAULT_THEMES.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = DEFAULT_THEMES.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = DEFAULT_THEMES.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = DEFAULT_THEMES.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = DEFAULT_THEMES.dim
