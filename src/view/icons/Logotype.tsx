import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'
import {SvgXml} from 'react-native-svg'

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
  const color =
    typeof fill === 'string'
      ? fill
      : typeof pal.text.color === 'string'
        ? pal.text.color
        : undefined

  if ('xml' in wordmark) {
    return (
      <SvgXml
        xml={wordmark.xml}
        width={size}
        height={Number(size) * wordmark.ratio}
        // @ts-ignore color drives `currentColor` fills inside the xml
        color={color}
      />
    )
  }

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
