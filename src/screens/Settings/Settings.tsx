import {useState} from 'react'
import {Alert, LayoutAnimation, Pressable, View} from 'react-native'
import {Linking} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {type AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useActorStatus} from '#/lib/actor-status'
import {HELP_DESK_URL} from '#/lib/constants'
import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {useApplyPullRequestOTAUpdate} from '#/lib/hooks/useOTAUpdates'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import * as persisted from '#/state/persisted'
import {clearStorage} from '#/state/persisted'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useDeleteActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, platform, tokens, useBreakpoints, useTheme} from '#/alf'
import {AgeAssuranceDismissibleNotice} from '#/components/ageAssurance/AgeAssuranceDismissibleNotice'
import {AvatarStackWithFetch} from '#/components/AvatarStack'
import {Button, ButtonText} from '#/components/Button'
import {useIsFindContactsFeatureEnabledBasedOnGeolocation} from '#/components/contacts/country-allowlist'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {Bell_Stroke2_Corner0_Rounded as NotificationIcon} from '#/components/icons/Bell'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon} from '#/components/icons/Chevron'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {Contacts_Stroke2_Corner2_Rounded as ContactsIcon} from '#/components/icons/Contacts'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Lock_Stroke2_Corner2_Rounded as LockIcon} from '#/components/icons/Lock'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {
  Person_Stroke2_Corner2_Rounded as PersonIcon,
  PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon,
  PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {ID as PolicyUpdate202508} from '#/components/PolicyUpdateOverlay/updates/202508/config'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {useFullVerificationState} from '#/components/verification'
import {
  shouldShowVerificationCheckButton,
  VerificationCheckButton,
} from '#/components/verification/VerificationCheckButton'
import {IS_IOS, IS_NATIVE} from '#/env'
import {IS_INTERNAL} from '#/env'
import {device, useStorage} from '#/storage'
import {useActivitySubscriptionsNudged} from '#/storage/hooks/activity-subscriptions-nudged'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const {_} = useLingui()
  const reducedMotion = useReducedMotion()
  const {logoutEveryAccount} = useSessionApi()
  const {accounts, currentAccount} = useSession()
  const switchAccountControl = useDialogControl()
  const signOutPromptControl = Prompt.usePromptControl()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {data: otherProfiles} = useProfilesQuery({
    handles: accounts
      .filter(acc => acc.did !== currentAccount?.did)
      .map(acc => acc.handle),
  })
  const {pendingDid, onPressSwitchAccount} = useAccountSwitcher()
  const [showAccounts, setShowAccounts] = useState(false)
  const [showDevOptions, setShowDevOptions] = useState(false)
  const findContactsEnabled =
    useIsFindContactsFeatureEnabledBasedOnGeolocation()
  const gate = useGate()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <AgeAssuranceDismissibleNotice style={[a.px_lg, a.pt_xs, a.pb_xl]} />

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
          {accounts.length > 1 ? (
            <>
              <SettingsList.PressableItem
                label={_(msg`Switch account`)}
                accessibilityHint={_(
                  msg`Shows other accounts you can switch to`,
                )}
                onPress={() => {
                  if (!reducedMotion) {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    )
                  }
                  setShowAccounts(s => !s)
                }}>
                <SettingsList.ItemIcon icon={PersonGroupIcon} />
                <SettingsList.ItemText>
                  <Trans>Switch account</Trans>
                </SettingsList.ItemText>
                {showAccounts ? (
                  <SettingsList.ItemIcon icon={ChevronUpIcon} size="md" />
                ) : (
                  <AvatarStackWithFetch
                    profiles={accounts
                      .map(acc => acc.did)
                      .filter(did => did !== currentAccount?.did)
                      .slice(0, 5)}
                  />
                )}
              </SettingsList.PressableItem>
              {showAccounts && (
                <>
                  <SettingsList.Divider />
                  {accounts
                    .filter(acc => acc.did !== currentAccount?.did)
                    .map(account => (
                      <AccountRow
                        key={account.did}
                        account={account}
                        profile={otherProfiles?.profiles?.find(
                          p => p.did === account.did,
                        )}
                        pendingDid={pendingDid}
                        onPressSwitchAccount={onPressSwitchAccount}
                      />
                    ))}
                  <AddAccountRow />
                </>
              )}
            </>
          ) : (
            <AddAccountRow />
          )}
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
            to="/settings/notifications"
            label={_(msg`Notifications`)}>
            <SettingsList.ItemIcon icon={NotificationIcon} />
            <SettingsList.ItemText>
              <Trans>Notifications</Trans>
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
          {IS_NATIVE &&
            findContactsEnabled &&
            !gate('disable_settings_find_contacts') && (
              <SettingsList.LinkItem
                to="/settings/find-contacts"
                label={_(msg`Find friends from contacts`)}>
                <SettingsList.ItemIcon icon={ContactsIcon} />
                <SettingsList.ItemText>
                  <Trans>Find friends from contacts</Trans>
                </SettingsList.ItemText>
              </SettingsList.LinkItem>
            )}
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
            accessibilityHint={_(msg`Opens helpdesk in browser`)}>
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
                  if (!reducedMotion) {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    )
                  }
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
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const shadow = useProfileShadow(profile)
  const moderationOpts = useModerationOpts()
  const verificationState = useFullVerificationState({
    profile: shadow,
  })
  const {isActive: live} = useActorStatus(profile)

  if (!moderationOpts) return null

  const moderation = moderateProfile(profile, moderationOpts)
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  return (
    <>
      <UserAvatar
        size={80}
        avatar={shadow.avatar}
        moderation={moderation.ui('avatar')}
        type={shadow.associated?.labeler ? 'labeler' : 'user'}
        live={live}
      />

      <View
        style={[
          a.flex_row,
          a.gap_xs,
          a.align_center,
          a.justify_center,
          a.w_full,
        ]}>
        <Text
          emoji
          testID="profileHeaderDisplayName"
          numberOfLines={1}
          style={[
            a.pt_sm,
            t.atoms.text,
            gtMobile ? a.text_4xl : a.text_3xl,
            a.font_bold,
          ]}>
          {displayName}
        </Text>
        {shouldShowVerificationCheckButton(verificationState) && (
          <View
            style={[
              {
                marginTop: platform({web: 8, ios: 8, android: 10}),
              },
            ]}>
            <VerificationCheckButton profile={shadow} size="lg" />
          </View>
        )}
      </View>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        {sanitizeHandle(profile.handle, '@')}
      </Text>
    </>
  )
}

function DevOptions() {
  const {_} = useLingui()
  const agent = useAgent()
  const [override, setOverride] = useStorage(device, [
    'policyUpdateDebugOverride',
  ])
  const onboardingDispatch = useOnboardingDispatch()
  const navigation = useNavigation<NavigationProp>()
  const {mutate: deleteChatDeclarationRecord} = useDeleteActorDeclaration()
  const {
    tryApplyUpdate,
    revertToEmbedded,
    isCurrentlyRunningPullRequestDeployment,
    currentChannel,
  } = useApplyPullRequestOTAUpdate()
  const [actyNotifNudged, setActyNotifNudged] = useActivitySubscriptionsNudged()

  const resetOnboarding = async () => {
    navigation.navigate('Home')
    onboardingDispatch({type: 'start'})
    Toast.show(_(msg`Onboarding reset`))
  }

  const clearAllStorage = async () => {
    await clearStorage()
    Toast.show(_(msg`Storage cleared, you need to restart the app now.`))
  }

  const onPressUnsnoozeReminder = () => {
    const lastEmailConfirm = new Date()
    // wind back 3 days
    lastEmailConfirm.setDate(lastEmailConfirm.getDate() - 3)
    persisted.write('reminders', {
      ...persisted.get('reminders'),
      lastEmailConfirm: lastEmailConfirm.toISOString(),
    })
    Toast.show(_(msg`You probably want to restart the app now.`))
  }

  const onPressActySubsUnNudge = () => {
    setActyNotifNudged(false)
  }

  const onPressApplyOta = () => {
    Alert.prompt(
      'Apply OTA',
      'Enter the channel for the OTA you wish to apply.',
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'default',
          text: 'Apply',
          onPress: (channel?: string) => {
            tryApplyUpdate(channel ?? '')
          },
        },
      ],
      'plain-text',
      isCurrentlyRunningPullRequestDeployment
        ? currentChannel
        : 'pull-request-',
    )
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
        onPress={onPressUnsnoozeReminder}
        label={_(msg`Unsnooze email reminder`)}>
        <SettingsList.ItemText>
          <Trans>Unsnooze email reminder</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      {actyNotifNudged && (
        <SettingsList.PressableItem
          onPress={onPressActySubsUnNudge}
          label={_(msg`Reset activity subscription nudge`)}>
          <SettingsList.ItemText>
            <Trans>Reset activity subscription nudge</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      )}
      <SettingsList.PressableItem
        onPress={() => clearAllStorage()}
        label={_(msg`Clear all storage data`)}>
        <SettingsList.ItemText>
          <Trans>Clear all storage data (restart after this)</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      {IS_IOS ? (
        <SettingsList.PressableItem
          onPress={onPressApplyOta}
          label={_(msg`Apply Pull Request`)}>
          <SettingsList.ItemText>
            <Trans>Apply Pull Request</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      ) : null}
      {IS_NATIVE && isCurrentlyRunningPullRequestDeployment ? (
        <SettingsList.PressableItem
          onPress={revertToEmbedded}
          label={_(msg`Unapply Pull Request`)}>
          <SettingsList.ItemText>
            <Trans>Unapply Pull Request {currentChannel}</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      ) : null}

      <SettingsList.Divider />
      <View style={[a.p_xl, a.gap_md]}>
        <Text style={[a.text_lg, a.font_semi_bold]}>
          PolicyUpdate202508 Debug
        </Text>

        <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_md]}>
          <Button
            onPress={() => {
              setOverride(!override)
            }}
            label="Toggle"
            color={override ? 'primary' : 'secondary'}
            size="small"
            style={[a.flex_1]}>
            <ButtonText>
              {override ? 'Disable debug mode' : 'Enable debug mode'}
            </ButtonText>
          </Button>

          <Button
            onPress={() => {
              device.set([PolicyUpdate202508], false)
              agent.bskyAppRemoveNuxs([PolicyUpdate202508])
              Toast.show(`Done`, 'info')
            }}
            label="Reset policy update nux"
            color="secondary"
            size="small"
            disabled={!override}>
            <ButtonText>Reset state</ButtonText>
          </Button>
        </View>
      </View>
      <SettingsList.Divider />
    </>
  )
}

function AddAccountRow() {
  const {_} = useLingui()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeEverything = useCloseAllActiveElements()

  const onAddAnotherAccount = () => {
    setShowLoggedOut(true)
    closeEverything()
  }

  return (
    <SettingsList.PressableItem
      onPress={onAddAnotherAccount}
      label={_(msg`Add another account`)}>
      <SettingsList.ItemIcon icon={PersonPlusIcon} />
      <SettingsList.ItemText>
        <Trans>Add another account</Trans>
      </SettingsList.ItemText>
    </SettingsList.PressableItem>
  )
}

function AccountRow({
  profile,
  account,
  pendingDid,
  onPressSwitchAccount,
}: {
  profile?: AppBskyActorDefs.ProfileViewDetailed
  account: SessionAccount
  pendingDid: string | null
  onPressSwitchAccount: (
    account: SessionAccount,
    logContext: 'Settings',
  ) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  const moderationOpts = useModerationOpts()
  const removePromptControl = Prompt.usePromptControl()
  const {removeAccount} = useSessionApi()
  const {isActive: live} = useActorStatus(profile)

  const onSwitchAccount = () => {
    if (pendingDid) return
    onPressSwitchAccount(account, 'Settings')
  }

  return (
    <View style={[a.relative]}>
      <SettingsList.PressableItem
        onPress={onSwitchAccount}
        label={_(msg`Switch account`)}>
        {moderationOpts && profile ? (
          <UserAvatar
            size={28}
            avatar={profile.avatar}
            moderation={moderateProfile(profile, moderationOpts).ui('avatar')}
            type={profile.associated?.labeler ? 'labeler' : 'user'}
            live={live}
            hideLiveBadge
          />
        ) : (
          <View style={[{width: 28}]} />
        )}
        <SettingsList.ItemText
          numberOfLines={1}
          style={[a.pr_2xl, a.leading_snug]}>
          {sanitizeHandle(account.handle, '@')}
        </SettingsList.ItemText>
        {pendingDid === account.did && <SettingsList.ItemIcon icon={Loader} />}
      </SettingsList.PressableItem>
      {!pendingDid && (
        <Menu.Root>
          <Menu.Trigger label={_(msg`Account options`)}>
            {({props, state}) => (
              <Pressable
                {...props}
                style={[
                  a.absolute,
                  {top: 10, right: tokens.space.lg},
                  a.p_xs,
                  a.rounded_full,
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <DotsHorizontal size="md" style={t.atoms.text} />
              </Pressable>
            )}
          </Menu.Trigger>
          <Menu.Outer showCancel>
            <Menu.Item
              label={_(msg`Remove account`)}
              onPress={() => removePromptControl.open()}>
              <Menu.ItemText>
                <Trans>Remove account</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={PersonXIcon} />
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      )}

      <Prompt.Basic
        control={removePromptControl}
        title={_(msg`Remove from quick access?`)}
        description={_(
          msg`This will remove @${account.handle} from the quick access list.`,
        )}
        onConfirm={() => {
          removeAccount(account)
          Toast.show(_(msg`Account removed from quick access`))
        }}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}
