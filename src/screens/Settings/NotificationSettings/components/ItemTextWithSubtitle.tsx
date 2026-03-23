import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Skele from '#/components/Skeleton'
import {Text} from '#/components/Typography'
import * as SettingsList from '../../components/SettingsList'

export function ItemTextWithSubtitle({
  titleText,
  subtitleText,
  bold = false,
  showSkeleton = false,
}: {
  titleText: React.ReactNode
  subtitleText: React.ReactNode
  bold?: boolean
  showSkeleton?: boolean
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_1, bold ? a.gap_xs : a.gap_2xs]}>
      <SettingsList.ItemText style={bold && [a.font_semi_bold, a.text_lg]}>
        {titleText}
      </SettingsList.ItemText>
      {showSkeleton ? (
        <Skele.Text style={[a.text_sm, {width: 120}]} />
      ) : (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
          {subtitleText}
        </Text>
      )}
    </View>
  )
}
