import {atoms as a, useTheme} from '#/alf'
import {contrastRatio, hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'
import {
  useCardPillColor,
  useCardSurface,
} from '#/components/atmosphere/cardSurface'
import {ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'

type LinkProps = React.ComponentProps<typeof Link>

/** How strongly the accent tints the pill, over the card's color. */
const ACCENT_TINT = 0.24

/**
 * A pill link with a trailing ↗, like “Read on Leaflet”, tinted with a
 * publication's accent color when it has one. The accent colors the text only
 * where it stays readable (WCAG AA) on the pill itself; otherwise the text
 * uses the app's text color. Without an accent, the pill matches the card's
 * other buttons.
 */
export function AccentLinkButton({
  label,
  accent,
  style,
  ...linkProps
}: Omit<LinkProps, 'children' | 'size' | 'color'> & {
  label: string
  /** An opaque hex color, e.g. from `getPublicationTheme`. */
  accent?: string
}) {
  const t = useTheme()
  const surface = useCardSurface()
  const pillColor = useCardPillColor()
  /* The pill's actual color: the accent tint laid over the card. */
  const background =
    (accent && blend(accent, surface.fill, ACCENT_TINT)) || pillColor
  const ratio = accent ? contrastRatio(accent, background) : null
  const textColor =
    accent && ratio !== null && ratio >= 4.5 ? accent : t.atoms.text.color

  return (
    <Link
      {...linkProps}
      label={label}
      size="small"
      color="secondary"
      style={[
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.gap_xs,
        a.px_lg,
        a.rounded_full,
        {backgroundColor: background},
        style,
      ]}>
      <ButtonText style={[{color: textColor}]}>{label}</ButtonText>
      <ArrowTopRightIcon size="sm" fill={textColor} />
    </Link>
  )
}

/**
 * `color` laid over `base` at `amount` opacity, as an opaque hex color. Undefined
 * if either isn't a hex color.
 */
function blend(color: string, base: string, amount: number) {
  const top = hexToRgb(color)
  const bottom = hexToRgb(base)
  if (!top || !bottom) return undefined
  const channel = (a: number, b: number) =>
    Math.round(a * amount + b * (1 - amount))
  return rgbToHex(
    channel(top.r, bottom.r),
    channel(top.g, bottom.g),
    channel(top.b, bottom.b),
  )
}
