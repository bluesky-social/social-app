import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {type TriggerChildProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'

export function StatusBadge({
  label,
  style,
  pressableProps,
}: {
  label: string
  style?: StyleProp<ViewStyle>
  pressableProps?: TriggerChildProps['props']
}) {
  const t = useTheme()

  const badgeStyle = [
    a.rounded_xs,
    t.atoms.bg_contrast_50,
    {
      paddingTop: 3,
      paddingBottom: 3,
      paddingLeft: 6,
      paddingRight: 6,
    },
    style,
  ]

  const labelText = (
    <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium]}>
      {label}
    </Text>
  )

  if (pressableProps) {
    return (
      <Pressable style={badgeStyle} {...pressableProps}>
        {labelText}
      </Pressable>
    )
  }
  return <View style={badgeStyle}>{labelText}</View>
}
