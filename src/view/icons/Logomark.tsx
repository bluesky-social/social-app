import LogomarkSvg from '../../../assets/icons/logomark.svg'
import type {PathProps, SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 54 / 61

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <LogomarkSvg
      width={size}
      height={Number(size) * ratio}
      fill={fill || pal.text.color}
      {...rest}
    />
  )
}
