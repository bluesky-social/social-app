import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AppIconImage} from '#/screens/Settings/AppIconSettings/AppIconImage'
import {useCurrentAppIcon} from '#/screens/Settings/AppIconSettings/useCurrentAppIcon'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Shapes_Stroke2_Corner0_Rounded as Shapes} from '#/components/icons/Shapes'

export function SettingsListItem() {
  const {_} = useLingui()
  const icon = useCurrentAppIcon()

  return (
    <SettingsList.LinkItem
      to="/settings/app-icon"
      label={_(msg`App Icon`)}
      contentContainerStyle={[a.align_start]}>
      <SettingsList.ItemIcon icon={Shapes} />
      <View style={[a.flex_1]}>
        <SettingsList.ItemText style={[a.pt_xs, a.pb_md]}>
          <Trans>App Icon</Trans>
        </SettingsList.ItemText>
        <AppIconImage icon={icon} size={60} />
      </View>
    </SettingsList.LinkItem>
  )
}
