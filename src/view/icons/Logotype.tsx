import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {getActiveBrand} from '#/brand/activeBrand'

const {wordmark} = getActiveBrand().logo

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      viewBox={wordmark.viewBox}
      {...rest}
      width={size}
      height={Number(size) * wordmark.ratio}>
      <Path fill={fill || pal.text.color} d={wordmark.path} />
    </Svg>
  )
}
