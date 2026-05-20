import {View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'

/**
 * The little blue dot used to nudge a user towards a certain feature. The dot
 * is absolutely positioned, and is intended to be configured by passing in
 * positional styles via `top`, `bottom`, `left`, and `right` props.
 */
export function Dot({
  top,
  bottom,
  left,
  right,
}: Pick<ViewStyle, 'top' | 'bottom' | 'left' | 'right'>) {
  const t = useTheme()
  return (
    <View style={[a.absolute, {top, bottom, left, right}]}>
      <View
        style={[
          a.rounded_full,
          {
            height: 8,
            width: 8,
            backgroundColor: t.palette.primary_500,
          },
        ]}
      />
    </View>
  )
}
