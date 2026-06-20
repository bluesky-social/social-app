import {type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {BrandLogo} from '#/components/icons/BrandLogo'

export function Logomark({
  fill,
  width,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  const size = parseInt(`${width ?? 32}`)

  return <BrandLogo size={size} fill={fill || pal.text.color} {...rest} />
}
