import {createTheme, type Palette} from '@bsky.app/alf'

import {Context, useAlf} from '#/alf'
import {contrastRatio, hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'
import {getPublicationColors} from '#/components/atmosphere/SiteStandard/utils'
import {type app} from '#/lexicons'

const CONTRAST_STEPS = [
  0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 975, 1000,
] as const

/**
 * Themes the subtree with the publication's own background and text colors,
 * so `t.atoms.bg`, `t.atoms.text`, their contrast steps and borders all
 * follow the publication. Everything else, like the primary palette, stays
 * the app's. Without readable publication colors, renders the children as is.
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
  view: app.bsky.embed.external.ViewArticlePublication
  children: React.ReactNode
}) {
  const alf = useAlf()
  const colors = getPublicationColors(view)
  if (!colors) return children

  const {background, foreground} = colors
  const palette: Palette = {...alf.theme.palette}
  for (const step of CONTRAST_STEPS) {
    palette[`contrast_${step}`] = mix(background, foreground, step / 1000)
  }
  /* Whichever of black and white stands out more is what the background isn't. */
  const isLight =
    (contrastRatio(background, '#000000') ?? 0) >
    (contrastRatio(background, '#FFFFFF') ?? 0)
  const theme = createTheme({
    scheme: isLight ? 'light' : 'dark',
    name: alf.theme.name,
    palette,
  })

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
