import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {BRAND_LOGO} from '#/config/brand-logo'

const ratio = BRAND_LOGO.ratio

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      viewBox={BRAND_LOGO.viewBox}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path fill={fill || pal.text.color} d={BRAND_LOGO.path} />
    </Svg>
  )
}
