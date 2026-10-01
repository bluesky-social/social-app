import {StyleSheet} from 'react-native'

import {useTheme} from '#/alf'
import {type Props, sizes} from './common'
import {createNanoIcon, NanoGlyph} from './nano'

export const Mark = createNanoIcon('Mark')

/**
 * The butterfly and wordmark. `width` sets the overall width; the mark and the
 * text are separate glyph layers so they can be coloured independently.
 */
export function Full({
  width,
  style,
  markFill,
  textFill,
  testID,
}: Omit<Props, 'fill' | 'size' | 'height'> & {
  markFill?: Props['fill']
  textFill?: Props['fill']
}) {
  const t = useTheme()
  const ratio = 123 / 555
  const fill = StyleSheet.flatten(style)?.color || t.palette.primary_500

  return (
    <NanoGlyph
      name="LogoFull"
      size={Number(width || sizes.md) * ratio}
      color={[markFill ?? fill, textFill ?? fill]}
      style={style}
      testID={testID}
    />
  )
}
