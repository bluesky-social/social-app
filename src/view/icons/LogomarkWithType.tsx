import {type PathProps, type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {NanoGlyph} from '#/components/icons/nano'

const ratio = 17 / 64

export function LogomarkWithType({
  fill,
  width,
  style,
}: {fill?: PathProps['fill']} & Pick<SvgProps, 'width' | 'style'>) {
  const t = useTheme()
  const size = parseInt(`${width || 32}`)

  return (
    <NanoGlyph
      name="LogomarkWithType"
      size={size * ratio}
      color={fill || t.atoms.text.color}
      style={style}
    />
  )
}
