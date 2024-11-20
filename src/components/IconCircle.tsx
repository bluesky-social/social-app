import {View} from 'react-native'

import {
  atoms as a,
  flatten,
  TextStyleProp,
  useTheme,
  ViewStyleProp,
} from '#/alf'
import {Props} from '#/components/icons/common'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'

export function IconCircle({
  icon: Icon,
  size = 'xl',
  style,
  iconStyle,
}: ViewStyleProp & {
  icon: typeof Growth
  size?: Props['size']
  iconStyle?: TextStyleProp['style']
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        {
          width: size === 'lg' ? 52 : 64,
          height: size === 'lg' ? 52 : 64,
          backgroundColor: t.palette.primary_50,
        },
        flatten(style),
      ]}>
      <Icon
        size={size}
        style={[
          {
            color: t.palette.primary_500,
          },
          flatten(iconStyle),
        ]}
      />
    </View>
  )
}
