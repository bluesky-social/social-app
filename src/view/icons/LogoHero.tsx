import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {BRAND_LOGO, BRAND_LOGO_3D} from '#/config/brand-logo'

/**
 * The dimensional brand wordmark for hero + marketing surfaces (welcome modal,
 * signup card, splash). A deep accent silhouette is drawn behind a brighter
 * accent face, offset up-and-left, for the drop-shadow look; both tones default
 * to the active accent ramp so the mark follows the brand colour.
 *
 * When the brand ships no 3D logo (BRAND_LOGO_3D === null) this falls back to
 * the flat wordmark filled with the accent, so hero surfaces stay on-brand
 * without a dimensional asset.
 */
export function LogoHero({
  faceFill,
  shadowFill,
  ...rest
}: {
  faceFill?: PathProps['fill']
  shadowFill?: PathProps['fill']
} & SvgProps) {
  const t = useTheme()
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 140)

  if (!BRAND_LOGO_3D) {
    const fill = faceFill || t.palette.primary_500
    return (
      <Svg
        fill="none"
        viewBox={BRAND_LOGO.viewBox}
        {...rest}
        width={size}
        height={Number(size) * BRAND_LOGO.ratio}>
        <Path fill={fill} d={BRAND_LOGO.path} />
      </Svg>
    )
  }

  const _face = faceFill || t.palette.primary_400
  const _shadow = shadowFill || t.palette.primary_900

  return (
    <Svg
      fill="none"
      viewBox={BRAND_LOGO_3D.viewBox}
      {...rest}
      width={size}
      height={Number(size) * BRAND_LOGO_3D.ratio}>
      <Path fill={_shadow} d={BRAND_LOGO_3D.shadowPath} />
      <Path fill={_face} d={BRAND_LOGO_3D.facePath} />
    </Svg>
  )
}
