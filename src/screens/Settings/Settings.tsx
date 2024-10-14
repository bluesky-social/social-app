import React from 'react'
import {View} from 'react-native'
import {Linking} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HELP_DESK_URL} from '#/lib/constants'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {useSessionApi} from '#/state/session'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Prompt from '#/components/Prompt'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const {_} = useLingui()
  const {logoutEveryAccount} = useSessionApi()
  const signOutPromptControl = Prompt.usePromptControl()

  return (
    <View style={[a.util_screen_outer]}>
      <TempHeader />
      <ScrollView contentContainerStyle={[a.pt_md, {paddingBottom: 100}]}>
        <SettingsList.LinkItem to="/settings/account" label={_(msg`Account`)}>
          <SettingsList.ItemIcon icon={PersonIcon} />
          <SettingsList.ItemText>
            <Trans>Account</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.LinkItem
          to="/settings/privacy-and-security"
          label={_(msg`Privacy and security`)}>
          <SettingsList.ItemIcon icon={PaintRollerIcon} />
          <SettingsList.ItemText>
            <Trans>Privacy and security</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.LinkItem to="/moderation" label={_(msg`Moderation`)}>
          <SettingsList.ItemIcon icon={HandIcon} />
          <SettingsList.ItemText>
            <Trans>Moderation</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.LinkItem
          to="/settings/content-and-media"
          label={_(msg`Content and media`)}>
          <SettingsList.ItemIcon icon={WindowIcon} />
          <SettingsList.ItemText>
            <Trans>Content and media</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.LinkItem
          to="/settings/accessibility-and-appearance"
          label={_(msg`Accessibility and appearance`)}>
          <SettingsList.ItemIcon icon={PaintRollerIcon} />
          <SettingsList.ItemText>
            <Trans>Accessibilty and appearance</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.LinkItem
          to="/settings/languages"
          label={_(msg`Languages`)}>
          <SettingsList.ItemIcon icon={EarthIcon} />
          <SettingsList.ItemText>
            <Trans>Languages</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.PressableItem
          onPress={() => Linking.openURL(HELP_DESK_URL)}
          label={_(msg`Help`)}
          accessibilityHint="Open helpdesk in browser">
          <SettingsList.ItemIcon icon={CircleQuestionIcon} />
          <SettingsList.ItemText>
            <Trans>Help</Trans>
          </SettingsList.ItemText>
          <SettingsList.Chevron />
        </SettingsList.PressableItem>
        <SettingsList.LinkItem to="/settings/about" label={_(msg`About`)}>
          <SettingsList.ItemIcon icon={BubbleInfoIcon} />
          <SettingsList.ItemText>
            <Trans>About</Trans>
          </SettingsList.ItemText>
        </SettingsList.LinkItem>
        <SettingsList.Divider />
        <SettingsList.PressableItem
          destructive
          onPress={() => signOutPromptControl.open()}
          label={_(msg`Sign out`)}>
          <SettingsList.ItemText>
            <Trans>Sign out</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      </ScrollView>

      <Prompt.Basic
        control={signOutPromptControl}
        title={_(msg`Sign out?`)}
        description={_(msg`You will be signed out of all your accounts.`)}
        onConfirm={() => logoutEveryAccount('Settings')}
        confirmButtonCta={_(msg`Sign out`)}
        cancelButtonCta={_(msg`Cancel`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}

/**
 * I want to make a nicer one in the future.
 * @deprecated
 */
export function TempHeader() {
  return <ViewHeader title="Settings" showBorder showOnDesktop />
}
