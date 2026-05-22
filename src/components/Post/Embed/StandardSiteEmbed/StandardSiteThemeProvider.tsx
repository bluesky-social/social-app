import {useMemo} from 'react'
import {type AppBskyEmbedExternal} from '@atproto/api'

import {ThemeProvider, useAlf, utils} from '#/alf'

/**
 * Overrides only the values needed for `secondary_inverted` buttons atm.
 */
export function StandardSiteThemeProvider({
  view,
  children,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  children: React.ReactNode
}) {
  const alf = useAlf()
  const themesOverride = useMemo(() => {
    const {accentRGB, accentForegroundRGB} = view.source?.theme || {}
    if (!accentRGB || !accentForegroundRGB) return alf.themes

    const accent = utils.rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b)
    const accentForeground = utils.rgbToHex(
      accentForegroundRGB.r,
      accentForegroundRGB.g,
      accentForegroundRGB.b,
    )
    const atoms = {
      text_inverted: {color: accentForeground},
    }
    const palette = {
      contrast_975: utils.darken(accent, 5), // hover
      contrast_900: accent, // bg
      contrast_600: utils.lighten(accent, 5), // disabled bg
      contrast_300: accentForeground, // disabled text
    }
    return {
      lightPalette: {
        ...alf.themes.lightPalette,
        ...palette,
      },
      darkPalette: {
        ...alf.themes.darkPalette,
        ...palette,
      },
      dimPalette: {
        ...alf.themes.dimPalette,
        ...palette,
      },
      light: {
        ...alf.themes.light,
        atoms: {
          ...alf.themes.light.atoms,
          ...atoms,
        },
        palette: {
          ...alf.themes.light.palette,
          ...palette,
        },
      },
      dark: {
        ...alf.themes.dark,
        atoms: {
          ...alf.themes.dark.atoms,
          ...atoms,
        },
        palette: {
          ...alf.themes.dark.palette,
          ...palette,
        },
      },
      dim: {
        ...alf.themes.dim,
        atoms: {
          ...alf.themes.dim.atoms,
          ...atoms,
        },
        palette: {
          ...alf.themes.dim.palette,
          ...palette,
        },
      },
    }
  }, [alf, view])

  return (
    <ThemeProvider theme={alf.themeName} themesOverride={themesOverride}>
      {children}
    </ThemeProvider>
  )
}
