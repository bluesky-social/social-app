import React from 'react'
import {View} from 'react-native'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Text} from '#/components/Typography'

export function Settings() {
  return (
    <View style={{marginLeft: -20, marginRight: -20}}>
      <Text style={{marginLeft: 20, paddingBottom: 12}}>Settings</Text>
      <SettingsList.LinkItem to="/settings" label="Account">
        <SettingsList.ItemIcon icon={PersonIcon} />
        <SettingsList.ItemText>Account</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings"
        label="Accessibility and appearance">
        <SettingsList.ItemIcon icon={PersonIcon} />
        <SettingsList.ItemText>Accessibilty & appearance</SettingsList.ItemText>
      </SettingsList.LinkItem>
    </View>
  )
}
