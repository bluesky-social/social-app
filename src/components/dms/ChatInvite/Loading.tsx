import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'

/**
 * Loading state for a chat invite: a centered spinner. The outer container
 * (height, border, etc.) varies per surface, so pass it via `style`.
 */
export function Loading({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()

  return (
    <View style={[a.align_center, a.justify_center, style]}>
      <Loader size="md" fill={t.atoms.text.color} />
    </View>
  )
}
