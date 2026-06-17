import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {BRAND_LOGO} from '#/config/brand-logo'

/**
 * mu brand wordmark. The mark and the wordmark are the same glyph for mu, so
 * this renders the shared <Path> from `#/config/brand-logo`. Defaults to the
 * theme text colour (ink on light, cotton on dark); callers can override.
 */
const ratio = BRAND_LOGO.ratio

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)
  const _fill = fill || pal.text.color

  return (
    <Svg
      fill="none"
      viewBox={BRAND_LOGO.viewBox}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path fill={_fill} d={BRAND_LOGO.path} />
    </Svg>
  )
}
