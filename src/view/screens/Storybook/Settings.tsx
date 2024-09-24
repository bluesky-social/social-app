import React from 'react'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'

export function Settings() {
  return (
    <>
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
    </>
  )
}
