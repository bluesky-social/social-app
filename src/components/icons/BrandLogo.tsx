import {type PathProps, type SvgProps, SvgXml} from 'react-native-svg'

import {useTheme} from '#/alf'
import {
  getLogo,
  type LogoVariant,
  substituteLogoColors,
} from '#/config/brand-logo'

/**
 * The single place that renders the brand logo. Every in-app logo surface -
 * <Logo>, <Logomark>, <Logotype>, <LogomarkWithType>, <LogoHero>, <Full>, the
 * splashes - delegates here, so logo rendering (SVG source, theming, aspect
 * ratio) lives in one file.
 *
 * Logos are SVGs (assets/brand/*.svg -> brand-logo.generated.json), rendered via
 * SvgXml. Theming follows the gen-logo convention: `currentColor` is driven by
 * the `fill` prop, and `theme:<paletteKey>` tokens are substituted from the
 * active theme palette so multi-tone logos follow the accent picker. The
 * pre-boot web splash passes an explicit `palette` (the default accent) since it
 * renders before the per-user theme is known.
 */
type BrandLogoProps = {
  /** Rendered width in px. Height derives from the logo aspect ratio. */
  size: number
  variant?: LogoVariant
  /** currentColor tint for single-tone marks. */
  fill?: PathProps['fill']
  /** Render in a square box (height = size) instead of aspect-correct. */
  square?: boolean
  /** Palette used to resolve `theme:` tokens. Defaults to the active theme. */
  palette?: Record<string, string>
} & Omit<SvgProps, 'fill' | 'width' | 'height' | 'color'>

export function BrandLogo({
  size,
  variant = 'mark',
  fill,
  square,
  palette,
  ...rest
}: BrandLogoProps) {
  const t = useTheme()
  const logo = getLogo(variant)
  const xml = substituteLogoColors(logo.xml, palette ?? t.palette)

  return (
    <SvgXml
      {...rest}
      xml={xml}
      width={size}
      height={square ? size : size * logo.ratio}
      color={fill}
    />
  )
}
