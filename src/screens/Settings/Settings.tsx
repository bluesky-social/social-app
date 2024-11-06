import React, {useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {Linking} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {IS_INTERNAL} from '#/lib/app-info'
import {HELP_DESK_URL} from '#/lib/constants'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {clearStorage} from '#/state/persisted'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useDeleteActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession, useSessionApi} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ProfileHeaderDisplayName} from '#/screens/Profile/Header/DisplayName'
import {ProfileHeaderHandle} from '#/screens/Profile/Header/Handle'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Lock_Stroke2_Corner2_Rounded as LockIcon} from '#/components/icons/Lock'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {
  Person_Stroke2_Corner2_Rounded as PersonIcon,
  PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon,
} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import * as Prompt from '#/components/Prompt'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const {_} = useLingui()
  const {logoutEveryAccount} = useSessionApi()
  const {accounts, currentAccount} = useSession()
  const switchAccountControl = useDialogControl()
  const signOutPromptControl = Prompt.usePromptControl()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeEverything = useCloseAllActiveElements()
  const [showDevOptions, setShowDevOptions] = useState(false)

  const onAddAnotherAccount = () => {
    setShowLoggedOut(true)
    closeEverything()
  }

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Settings`)} />
      <Layout.Content>
        <SettingsList.Container>
          <View
            style={[
              a.px_xl,
              a.pt_md,
              a.pb_md,
              a.w_full,
              a.gap_2xs,
              a.align_center,
              {minHeight: 160},
            ]}>
            {profile && <ProfilePreview profile={profile} />}
          </View>
          <SettingsList.PressableItem
            label={
              accounts.length > 1
                ? _(msg`Switch account`)
                : _(msg`Add another account`)
            }
            onPress={() =>
              accounts.length > 1
                ? switchAccountControl.open()
                : onAddAnotherAccount()
            }>
            <SettingsList.ItemIcon icon={PersonGroupIcon} />
            <SettingsList.ItemText>
              {accounts.length > 1 ? (
                <Trans>Switch account</Trans>
              ) : (
                <Trans>Add another account</Trans>
              )}
            </SettingsList.ItemText>
            {accounts.length > 1 && (
              <AvatarStack
                profiles={accounts
                  .map(acc => acc.did)
                  .filter(did => did !== currentAccount?.did)
                  .slice(0, 5)}
              />
            )}
          </SettingsList.PressableItem>
          <SettingsList.Divider />
          <SettingsList.LinkItem to="/settings/account" label={_(msg`Account`)}>
            <SettingsList.ItemIcon icon={PersonIcon} />
            <SettingsList.ItemText>
              <Trans>Account</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/privacy-and-security"
            label={_(msg`Privacy and security`)}>
            <SettingsList.ItemIcon icon={LockIcon} />
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
            to="/settings/appearance"
            label={_(msg`Appearance`)}>
            <SettingsList.ItemIcon icon={PaintRollerIcon} />
            <SettingsList.ItemText>
              <Trans>Appearance</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/accessibility"
            label={_(msg`Accessibility`)}>
            <SettingsList.ItemIcon icon={AccessibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Accessibility</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/language"
            label={_(msg`Languages`)}>
            <SettingsList.ItemIcon icon={EarthIcon} />
            <SettingsList.ItemText>
              <Trans>Languages</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.PressableItem
            onPress={() => Linking.openURL(HELP_DESK_URL)}
            label={_(msg`Help`)}
            accessibilityHint={_(msg`Open helpdesk in browser`)}>
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
          {IS_INTERNAL && (
            <>
              <SettingsList.Divider />
              <SettingsList.PressableItem
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  )
                  setShowDevOptions(d => !d)
                }}
                label={_(msg`Developer options`)}>
                <SettingsList.ItemIcon icon={CodeBracketsIcon} />
                <SettingsList.ItemText>
                  <Trans>Developer options</Trans>
                </SettingsList.ItemText>
              </SettingsList.PressableItem>
              {showDevOptions && <DevOptions />}
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>

      <Prompt.Basic
        control={signOutPromptControl}
        title={_(msg`Sign out?`)}
        description={_(msg`You will be signed out of all your accounts.`)}
        onConfirm={() => logoutEveryAccount('Settings')}
        confirmButtonCta={_(msg`Sign out`)}
        cancelButtonCta={_(msg`Cancel`)}
        confirmButtonColor="negative"
      />

      <SwitchAccountDialog control={switchAccountControl} />
    </Layout.Screen>
  )
}

function ProfilePreview({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const shadow = useProfileShadow(profile)
  const moderationOpts = useModerationOpts()

  if (!moderationOpts) return null

  const moderation = moderateProfile(profile, moderationOpts)

  return (
    <>
      <UserAvatar
        size={80}
        avatar={shadow.avatar}
        moderation={moderation.ui('avatar')}
      />
      <ProfileHeaderDisplayName profile={shadow} moderation={moderation} />
      <ProfileHeaderHandle profile={shadow} />
    </>
  )
}

function DevOptions() {
  const {_} = useLingui()
  const onboardingDispatch = useOnboardingDispatch()
  const navigation = useNavigation<NavigationProp>()
  const {mutate: deleteChatDeclarationRecord} = useDeleteActorDeclaration()

  const resetOnboarding = async () => {
    navigation.navigate('Home')
    onboardingDispatch({type: 'start'})
    Toast.show(_(msg`Onboarding reset`))
  }

  const clearAllStorage = async () => {
    await clearStorage()
    Toast.show(_(msg`Storage cleared, you need to restart the app now.`))
  }

  return (
    <>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('Log')}
        label={_(msg`Open system log`)}>
        <SettingsList.ItemText>
          <Trans>System log</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('Debug')}
        label={_(msg`Open storybook page`)}>
        <SettingsList.ItemText>
          <Trans>Storybook</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('DebugMod')}
        label={_(msg`Open moderation debug page`)}>
        <SettingsList.ItemText>
          <Trans>Debug Moderation</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => deleteChatDeclarationRecord()}
        label={_(msg`Open storybook page`)}>
        <SettingsList.ItemText>
          <Trans>Delete chat declaration record</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => resetOnboarding()}
        label={_(msg`Reset onboarding state`)}>
        <SettingsList.ItemText>
          <Trans>Reset onboarding state</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => clearAllStorage()}
        label={_(msg`Clear all storage data`)}>
        <SettingsList.ItemText>
          <Trans>Clear all storage data (restart after this)</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
    </>
  )
}
