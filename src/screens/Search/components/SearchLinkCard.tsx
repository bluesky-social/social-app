import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Link, type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function SearchLinkCard({
  label,
  to,
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
    <Link to={to} label={label}>
      {({focused, hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            t.atoms.border_contrast_low,
            a.py_lg,
            a.px_md,
            (focused || hovered || pressed) && t.atoms.bg_contrast_25,
            style,
          ]}>
          <Text style={[a.text_sm, a.leading_snug]}>{label}</Text>
        </View>
      )}
    </Link>
  )
}
