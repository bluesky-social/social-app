import {type MaterialColors, type RgbaHex} from '@expo/ui/jetpack-compose'

import {type Theme, useTheme} from '#/alf'

/**
 * ALF colors are hex strings, but typed as `string`. `Host` parses each one
 * with `processColor`, so any color string works at runtime.
 */
function color(value: string) {
  return value as RgbaHex
}

/**
 * Maps an ALF theme onto the Material 3 color roles, so Jetpack Compose
 * components look like the rest of the app instead of taking Material You's
 * wallpaper colors. ALF's dark palettes are inverted, so the same steps work
 * for every theme.
 */
export function getMaterialColors(t: Theme): Partial<MaterialColors> {
  const isLight = t.name === 'light'
  const bg = t.atoms.bg.backgroundColor
  const text = t.atoms.text.color
  /*
   * Floating surfaces, like menus, sit on `bg` in light mode and one step up
   * in dark modes, as the web dropdown menu does.
   */
  const raised = isLight ? bg : t.atoms.bg_contrast_25.backgroundColor

  return {
    primary: color(t.palette.primary_500),
    onPrimary: color(t.palette.white),
    primaryContainer: color(t.palette.primary_50),
    onPrimaryContainer: color(text),
    inversePrimary: color(t.palette.primary_300),
    // ALF has one accent, so the secondary and tertiary roles use it too.
    secondary: color(t.palette.primary_500),
    onSecondary: color(t.palette.white),
    secondaryContainer: color(t.palette.primary_50),
    onSecondaryContainer: color(text),
    tertiary: color(t.palette.primary_500),
    onTertiary: color(t.palette.white),
    tertiaryContainer: color(t.palette.primary_50),
    onTertiaryContainer: color(text),
    background: color(bg),
    onBackground: color(text),
    surface: color(bg),
    onSurface: color(text),
    surfaceVariant: color(t.atoms.bg_contrast_25.backgroundColor),
    onSurfaceVariant: color(t.atoms.text_contrast_medium.color),
    // No primary tint on elevated surfaces.
    surfaceTint: color('#00000000'),
    inverseSurface: color(t.palette.contrast_900),
    inverseOnSurface: color(t.palette.contrast_0),
    error: color(t.palette.negative_500),
    onError: color(t.palette.white),
    errorContainer: color(t.palette.negative_50),
    onErrorContainer: color(text),
    outline: color(t.atoms.border_contrast_high.borderColor),
    outlineVariant: color(t.atoms.border_contrast_low.borderColor),
    scrim: color(t.palette.black),
    surfaceBright: color(isLight ? bg : t.palette.contrast_100),
    surfaceDim: color(isLight ? t.palette.contrast_50 : bg),
    surfaceContainerLowest: color(bg),
    surfaceContainerLow: color(raised),
    surfaceContainer: color(
      isLight ? t.palette.contrast_25 : t.palette.contrast_50,
    ),
    surfaceContainerHigh: color(
      isLight ? t.palette.contrast_50 : t.palette.contrast_100,
    ),
    surfaceContainerHighest: color(
      isLight ? t.palette.contrast_100 : t.palette.contrast_200,
    ),
  }
}

/**
 * Theme props for a Jetpack Compose `Host` from `@expo/ui`, which theme its
 * Compose children with the current ALF theme: `<Host {...useMaterialTheme()}>`.
 */
export function useMaterialTheme() {
  const t = useTheme()
  return {
    colorScheme: t.scheme,
    colorOverrides: getMaterialColors(t),
  }
}
