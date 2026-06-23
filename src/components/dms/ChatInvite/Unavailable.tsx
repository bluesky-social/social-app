import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Text} from '#/components/Typography'
import {useChatInvite} from './Context'

/**
 * "No longer available" state for a chat invite, shown when the link is
 * disabled, invalid, or otherwise can't be resolved. The outer container
 * (height, border, etc.) varies per surface, so pass it via `style`.
 */
export function Unavailable({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {hasFixedHeight} = useChatInvite()

  return (
    <View
      style={[a.flex_row, a.align_center, a.justify_center, a.gap_xs, style]}>
      <WarningIcon size="md" fill={t.atoms.text_contrast_medium.color} />
      <Text
        style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}
        allowFontScaling={!hasFixedHeight}>
        <Trans>Chat invite link no longer available</Trans>
      </Text>
    </View>
  )
}
