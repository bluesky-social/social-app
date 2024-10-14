import React from 'react'
import {View} from 'react-native'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import {Text} from '#/components/Typography'

export function Settings() {
  return (
    <View style={{marginLeft: -20, marginRight: -20}}>
      <Text style={{marginLeft: 20, paddingBottom: 12}}>Settings</Text>
      <SettingsList.LinkItem to="/settings" label="Account">
        <SettingsList.ItemIcon icon={PersonIcon} />
        <SettingsList.ItemText>Account</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Privacy and security">
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>Privacy and security</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Moderation">
        <SettingsList.ItemIcon icon={HandIcon} />
        <SettingsList.ItemText>Moderation</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Content and media">
        <SettingsList.ItemIcon icon={WindowIcon} />
        <SettingsList.ItemText>Content and media</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings"
        label="Accessibility and appearance">
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>
          Accessibilty and appearance
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Languages">
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>Languages</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Help">
        <SettingsList.ItemIcon icon={CircleQuestionIcon} />
        <SettingsList.ItemText>Help</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="About">
        <SettingsList.ItemIcon icon={BubbleInfoIcon} />
        <SettingsList.ItemText>About</SettingsList.ItemText>
      </SettingsList.LinkItem>
    </View>
  )
}
