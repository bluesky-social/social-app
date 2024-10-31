import React from 'react'
import {View} from 'react-native'
import {Linking} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HELP_DESK_URL} from '#/lib/constants'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ProfileHeaderDisplayName} from '#/screens/Profile/Header/DisplayName'
import {ProfileHeaderHandle} from '#/screens/Profile/Header/Handle'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
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

const AVI_SIZE = 26
const HALF_AVI_SIZE = AVI_SIZE / 2

function AvatarStack({profiles}: {profiles: string[]}) {
  const {data, error} = useProfilesQuery({handles: profiles})
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  if (error) {
    console.error(error)
    return null
  }

  const isPending = !data || !moderationOpts

  const items = isPending
    ? Array.from({length: profiles.length}).map((_, i) => ({
        key: i,
        profile: null,
        moderation: null,
      }))
    : data.profiles.map(item => ({
        key: item.did,
        profile: item,
        moderation: moderateProfile(item, moderationOpts),
      }))

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.relative,
        {width: AVI_SIZE + (items.length - 1) * HALF_AVI_SIZE},
      ]}>
      {items.map((item, i) => (
        <View
          key={item.key}
          style={[
            t.atoms.bg_contrast_25,
            a.relative,
            {
              width: AVI_SIZE,
              height: AVI_SIZE,
              left: i * -HALF_AVI_SIZE,
              borderWidth: 1,
              borderColor: t.atoms.bg.backgroundColor,
              borderRadius: 999,
              zIndex: 3 - i,
            },
          ]}>
          {item.profile && (
            <UserAvatar
              size={AVI_SIZE - 2}
              avatar={item.profile.avatar}
              moderation={item.moderation.ui('avatar')}
            />
          )}
        </View>
      ))}
    </View>
  )
}
