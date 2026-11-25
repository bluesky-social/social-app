import {createTheme, type Palette} from '@bsky.app/alf'

import {Context, useAlf} from '#/alf'
import {contrastRatio, hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'
import {getPublicationColors} from '#/components/atmosphere/SiteStandard/utils'
import {type app} from '#/lexicons'

const CONTRAST_STEPS = [
  0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975, 1000,
] as const
const PRIMARY_STEPS = [
  25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975,
] as const

/**
 * Themes the subtree with the publication's own background and text colors,
 * so `t.atoms.bg`, `t.atoms.text`, their contrast steps and borders all
 * follow the publication. The primary palette follows its accent too, when
 * that stays readable. Everything else comes from the app. Without a
 * publication or readable colors, renders the children as is.
 *
 * The publication's colors are used whatever the app theme is, the way its
 * site looks the same to everyone.
 *
 * Renders the alf Context directly (rather than nesting a ThemeProvider) so
 * that font-scale and other parent state stay live in the subtree.
 */
export function StandardSiteThemeProvider({
  view,
  children,
}: {
  view?: app.bsky.embed.external.ViewArticlePublication
  children: React.ReactNode
}) {
  const alf = useAlf()
  const colors = view && getPublicationColors(view)
  if (!colors) return children

  const {background, foreground, accent} = colors
  /* Whichever of black and white stands out more is what the background isn't. */
  const isLight =
    (contrastRatio(background, '#000000') ?? 0) >
    (contrastRatio(background, '#FFFFFF') ?? 0)
  /*
   * Colors not taken from the publication come from the app theme of the same
   * lightness, so they stay readable whatever the app theme is.
   */
  const base = isLight ? alf.themes.light : alf.themes.dark
  let palette: Palette = {...base.palette}
  for (const step of CONTRAST_STEPS) {
    palette[`contrast_${step}`] = mix(background, foreground, step / 1000)
  }
  if (accent) {
    /*
     * Lighter steps blend the accent into the background, darker ones into
     * the text, reaching it by 900 like the app's own scale. Kept only if the faintest pairing in use, `primary_700` on
     * `primary_100` like a hovered active like button, is still readable.
     */
    const accented: Palette = {...palette}
    for (const step of PRIMARY_STEPS) {
      accented[`primary_${step}`] =
        step <= 500
          ? mix(background, accent, step / 500)
          : mix(accent, foreground, Math.min((step - 500) / 400, 1))
    }
    const ratio = contrastRatio(accented.primary_700, accented.primary_100)
    if (ratio !== null && ratio >= 4.5) palette = accented
  }
  const theme = createTheme({scheme: base.scheme, name: base.name, palette})

  return <Context.Provider value={{...alf, theme}}>{children}</Context.Provider>
}

/** `from` moved `amount` (0-1) of the way to `to`. */
function mix(from: string, to: string, amount: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  if (!a || !b) return from
  const channel = (x: number, y: number) => Math.round(x + (y - x) * amount)
  return rgbToHex(channel(a.r, b.r), channel(a.g, b.g), channel(a.b, b.b))
}

/**
 * Whether a `StandardSiteThemeProvider` above has applied a publication's
 * colors, rather than leaving the app's theme in place.
 */
export function useHasPublicationTheme() {
  const alf = useAlf()
  return alf.theme !== alf.themes[alf.themeName]
}

/**
 * Puts the app's theme back under a `StandardSiteThemeProvider`, for menus and
 * dialogs that open from a themed card but aren't part of it.
 */
export function AppThemeProvider({children}: {children: React.ReactNode}) {
  const alf = useAlf()
  const hasPublicationTheme = useHasPublicationTheme()
  if (!hasPublicationTheme) return children
  return (
    <Context.Provider value={{...alf, theme: alf.themes[alf.themeName]}}>
      {children}
    </Context.Provider>
  )
}
