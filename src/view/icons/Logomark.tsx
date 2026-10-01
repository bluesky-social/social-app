import {type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {NanoGlyph} from '#/components/icons/nano'

const ratio = 54 / 61

export function Logomark({
  fill,
  width,
  style,
}: {fill?: PathProps['fill']} & Pick<SvgProps, 'width' | 'style'>) {
  const pal = usePalette('default')
  const size = parseInt(`${width || 32}`)

  return (
    <NanoGlyph
      name="Logomark"
      size={size * ratio}
      color={(fill || pal.text.color) as string}
      style={style}
    />
  )
}
