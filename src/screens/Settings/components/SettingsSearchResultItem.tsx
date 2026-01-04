import {View} from 'react-native'
import {Linking} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type SettingsSearchResult} from '../useSettingsSearch'

export function SettingsSearchResultItem({
  item,
  matchedKeywords,
}: SettingsSearchResult) {
  const t = useTheme()
  const {_} = useLingui()

  const content = (
    <>
      <SettingsList.ItemIcon icon={item.icon} />
      <View style={[a.flex_1, a.gap_2xs]}>
        <SettingsList.ItemText>{_(item.titleKey)}</SettingsList.ItemText>
        {matchedKeywords.length > 0 && (
          <Text
            style={[a.text_sm, a.leading_normal, t.atoms.text_contrast_medium]}
            numberOfLines={2}>
            {matchedKeywords.join(', ')}
          </Text>
        )}
      </View>
    </>
  )

  if (item.externalUrl) {
    return (
      <SettingsList.PressableItem
        onPress={() => Linking.openURL(item.externalUrl!)}
        label={_(item.titleKey)}
        accessibilityHint={_(msg`Opens in browser`)}>
        {content}
        <SettingsList.Chevron />
      </SettingsList.PressableItem>
    )
  }

  return (
    <SettingsList.LinkItem to={item.to!} label={_(item.titleKey)}>
      {content}
    </SettingsList.LinkItem>
  )
}
