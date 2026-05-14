import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'
import {SvgXml} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {getActiveBrand} from '#/brand/activeBrand'

const {logomark} = getActiveBrand().logo

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)
  const color =
    typeof fill === 'string'
      ? fill
      : typeof pal.text.color === 'string'
        ? pal.text.color
        : undefined

  if ('xml' in logomark) {
    return (
      <SvgXml
        xml={logomark.xml}
        width={size}
        height={Number(size) * logomark.ratio}
        // @ts-ignore color drives `currentColor` fills inside the xml
        color={color}
      />
    )
  }

  return (
    <Svg
      fill="none"
      viewBox={logomark.viewBox}
      {...rest}
      width={size}
      height={Number(size) * logomark.ratio}>
      <Path fill={fill || pal.text.color} d={logomark.path} />
    </Svg>
  )
}
