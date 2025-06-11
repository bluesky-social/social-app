import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as SettingsList from '../../components/SettingsList'

export function ItemTextWithSubtitle({
  titleText,
  subtitleText,
  bold = false,
}: {
  titleText: React.ReactNode
  subtitleText: React.ReactNode
  bold?: boolean
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_1, a.gap_2xs]}>
      <SettingsList.ItemText style={bold && [a.font_bold, a.text_lg]}>
        {titleText}
      </SettingsList.ItemText>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
        {subtitleText}
      </Text>
    </View>
  )
}
