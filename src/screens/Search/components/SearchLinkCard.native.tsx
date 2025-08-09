import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function SearchLinkCard({
  label,
  onPress,
  style,
}: {
  label: string
  /**
   * @platform web
   */
  to: LinkProps['to']
  /**
   * @platform native
   */
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()

  return (
    <Button label={label} onPress={onPress}>
      {({focused, hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            t.atoms.border_contrast_low,
            a.p_lg,
            (focused || hovered || pressed) && t.atoms.bg_contrast_25,
            style,
          ]}>
          <Text style={[a.text_sm, a.leading_snug]}>{label}</Text>
        </View>
      )}
    </Button>
  )
}
