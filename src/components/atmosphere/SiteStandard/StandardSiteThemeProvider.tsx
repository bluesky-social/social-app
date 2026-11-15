import {Context, useAlf, utils} from '#/alf'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {type app} from '#/lexicons'

/**
 * Overrides only the values needed for `secondary_inverted` buttons atm.
 *
 * Renders the alf Context directly (rather than nesting a ThemeProvider) so
 * that font-scale and other parent state stay live in the subtree.
 */
export function StandardSiteThemeProvider({
  view,
  children,
}: {
  view: app.bsky.embed.external.ViewArticlePublication
  children: React.ReactNode
}) {
  const alf = useAlf()
  const theme = getPublicationTheme(view)
  if (!theme) return children

  const {accent, accentForeground} = theme
  const atomsOverride = {
    text_inverted: {color: accentForeground},
  }
  const paletteOverride = {
    contrast_975: utils.darken(accent, 5), // hover
    contrast_900: accent, // bg
    contrast_600: utils.lighten(accent, 5), // disabled bg
    contrast_300: accentForeground, // disabled text
  }

  const themes = {
    ...alf.themes,
    lightPalette: {...alf.themes.lightPalette, ...paletteOverride},
    darkPalette: {...alf.themes.darkPalette, ...paletteOverride},
    dimPalette: {...alf.themes.dimPalette, ...paletteOverride},
    light: {
      ...alf.themes.light,
      atoms: {...alf.themes.light.atoms, ...atomsOverride},
      palette: {...alf.themes.light.palette, ...paletteOverride},
    },
    dark: {
      ...alf.themes.dark,
      atoms: {...alf.themes.dark.atoms, ...atomsOverride},
      palette: {...alf.themes.dark.palette, ...paletteOverride},
    },
    dim: {
      ...alf.themes.dim,
      atoms: {...alf.themes.dim.atoms, ...atomsOverride},
      palette: {...alf.themes.dim.palette, ...paletteOverride},
    },
  }

  const value = {
    ...alf,
    themes,
    theme: themes[alf.themeName],
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
