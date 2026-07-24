import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {AppIconImage} from '#/screens/Settings/AppIconSettings/AppIconImage'
import {useCurrentAppIcon} from '#/screens/Settings/AppIconSettings/useCurrentAppIcon'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Shapes_Stroke2_Corner0_Rounded as Shapes} from '#/components/icons/Shapes'

export function SettingsListItem() {
  const {t: l} = useLingui()
  const icon = useCurrentAppIcon()

  return (
    <SettingsList.LinkItem
      to="/settings/app-icon"
      label={l`App Icon`}
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
