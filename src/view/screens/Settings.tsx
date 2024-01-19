import React from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Pressable,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import * as AppInfo from 'lib/app-info'
import {s, colors} from 'lib/styles'
import {ScrollView} from '../com/util/Views'
import {Link, TextLink} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import * as Toast from '../com/util/Toast'
import {UserAvatar} from '../com/util/UserAvatar'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {SelectableBtn} from 'view/com/util/forms/SelectableBtn'
import {usePalette} from 'lib/hooks/usePalette'
import {useCustomPalette} from 'lib/hooks/useCustomPalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useAccountSwitcher} from 'lib/hooks/useAccountSwitcher'
import {useAnalytics} from 'lib/analytics/analytics'
import {NavigationProp} from 'lib/routes/types'
import {HandIcon, HashtagIcon} from 'lib/icons'
import Clipboard from '@react-native-clipboard/clipboard'
import {makeProfileLink} from 'lib/routes/links'
import {AccountDropdownBtn} from 'view/com/util/AccountDropdownBtn'
import {SimpleViewHeader} from 'view/com/util/SimpleViewHeader'
import {RQKEY as RQKEY_PROFILE} from '#/state/queries/profile'
import {useModalControls} from '#/state/modals'
import {
  useSetMinimalShellMode,
  useColorMode,
  useSetColorMode,
  useOnboardingDispatch,
} from '#/state/shell'
import {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from '#/state/preferences'
import {
  useSession,
  useSessionApi,
  SessionAccount,
  getAgent,
} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'
import {useClearPreferencesMutation} from '#/state/queries/preferences'
import {useInviteCodesQuery} from '#/state/queries/invites'
import {clear as clearStorage} from '#/state/persisted/store'
import {clearLegacyStorage} from '#/state/persisted/legacy'

// TEMPORARY (APP-700)
// remove after backend testing finishes
// -prf
import {useDebugHeaderSetting} from 'lib/api/debug-appview-proxy-header'
import {STATUS_PAGE_URL} from 'lib/constants'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import {isNative} from '#/platform/detection'

function SettingsAccountCard({account}: {account: SessionAccount}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isSwitchingAccounts, currentAccount} = useSession()
  const {logout} = useSessionApi()
  const {data: profile} = useProfileQuery({did: account.did})
  const isCurrentAccount = account.did === currentAccount?.did
  const {onPressSwitchAccount} = useAccountSwitcher()

  const contents = (
    <View style={[pal.view, styles.linkCard]}>
      <View style={styles.avi}>
        <UserAvatar size={40} avatar={profile?.avatar} />
      </View>
      <View style={[s.flex1]}>
        <Text type="md-bold" style={pal.text}>
          {profile?.displayName || account.handle}
        </Text>
        <Text type="sm" style={pal.textLight}>
          {account.handle}
        </Text>
      </View>

      {isCurrentAccount ? (
        <TouchableOpacity
          testID="signOutBtn"
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Sign out`)}
          accessibilityHint={`Signs ${profile?.displayName} out of Bluesky`}>
          <Text type="lg" style={pal.link}>
            <Trans>Sign out</Trans>
          </Text>
        </TouchableOpacity>
      ) : (
        <AccountDropdownBtn account={account} />
      )}
    </View>
  )

  return isCurrentAccount ? (
    <Link
      href={makeProfileLink({
        did: currentAccount?.did,
        handle: currentAccount?.handle,
      })}
      title={_(msg`Your profile`)}
      noFeedback>
      {contents}
    </Link>
  ) : (
    <TouchableOpacity
      testID={`switchToAccountBtn-${account.handle}`}
      key={account.did}
      onPress={
        isSwitchingAccounts ? undefined : () => onPressSwitchAccount(account)
      }
      accessibilityRole="button"
      accessibilityLabel={_(msg`Switch to ${account.handle}`)}
      accessibilityHint={_(msg`Switches the account you are logged in to`)}>
      {contents}
    </TouchableOpacity>
  )
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const queryClient = useQueryClient()
  const colorMode = useColorMode()
  const setColorMode = useSetColorMode()
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const requireAltTextEnabled = useRequireAltTextEnabled()
  const setRequireAltTextEnabled = useSetRequireAltTextEnabled()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()
  const onboardingDispatch = useOnboardingDispatch()
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const {screen, track} = useAnalytics()
  const {openModal} = useModalControls()
  const {isSwitchingAccounts, accounts, currentAccount} = useSession()
  const [debugHeaderEnabled, toggleDebugHeader] = useDebugHeaderSetting(
    getAgent(),
  )
  const {mutate: clearPreferences} = useClearPreferencesMutation()
  const {data: invites} = useInviteCodesQuery()
  const invitesAvailable = invites?.available?.length ?? 0
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const primaryBg = useCustomPalette<ViewStyle>({
    light: {backgroundColor: colors.blue0},
    dark: {backgroundColor: colors.blue6},
  })
  const primaryText = useCustomPalette<TextStyle>({
    light: {color: colors.blue3},
    dark: {color: colors.blue2},
  })

  const dangerBg = useCustomPalette<ViewStyle>({
    light: {backgroundColor: colors.red1},
    dark: {backgroundColor: colors.red7},
  })
  const dangerText = useCustomPalette<TextStyle>({
    light: {color: colors.red4},
    dark: {color: colors.red2},
  })

  useFocusEffect(
    React.useCallback(() => {
      screen('Settings')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  const onPressAddAccount = React.useCallback(() => {
    track('Settings:AddAccountButtonClicked')
    setShowLoggedOut(true)
    closeAllActiveElements()
  }, [track, setShowLoggedOut, closeAllActiveElements])

  const onPressChangeHandle = React.useCallback(() => {
    track('Settings:ChangeHandleButtonClicked')
    openModal({
      name: 'change-handle',
      onChanged() {
        if (currentAccount) {
          // refresh my profile
          queryClient.invalidateQueries({
            queryKey: RQKEY_PROFILE(currentAccount.did),
          })
        }
      },
    })
  }, [track, queryClient, openModal, currentAccount])

  const onPressInviteCodes = React.useCallback(() => {
    track('Settings:InvitecodesButtonClicked')
    openModal({name: 'invite-codes'})
  }, [track, openModal])

  const onPressLanguageSettings = React.useCallback(() => {
    navigation.navigate('LanguageSettings')
  }, [navigation])

  const onPressDeleteAccount = React.useCallback(() => {
    openModal({name: 'delete-account'})
  }, [openModal])

  const onPressResetPreferences = React.useCallback(async () => {
    clearPreferences()
  }, [clearPreferences])

  const onPressResetOnboarding = React.useCallback(async () => {
    onboardingDispatch({type: 'start'})
    Toast.show(_(msg`Onboarding reset`))
  }, [onboardingDispatch, _])

  const onPressBuildInfo = React.useCallback(() => {
    Clipboard.setString(
      `Build version: ${AppInfo.appVersion}; Platform: ${Platform.OS}`,
    )
    Toast.show(_(msg`Copied build version to clipboard`))
  }, [_])

  const openHomeFeedPreferences = React.useCallback(() => {
    navigation.navigate('PreferencesHomeFeed')
  }, [navigation])

  const openThreadsPreferences = React.useCallback(() => {
    navigation.navigate('PreferencesThreads')
  }, [navigation])

  const onPressAppPasswords = React.useCallback(() => {
    navigation.navigate('AppPasswords')
  }, [navigation])

  const onPressSystemLog = React.useCallback(() => {
    navigation.navigate('Log')
  }, [navigation])

  const onPressStorybook = React.useCallback(() => {
    navigation.navigate('Debug')
  }, [navigation])

  const onPressSavedFeeds = React.useCallback(() => {
    navigation.navigate('SavedFeeds')
  }, [navigation])

  const onPressStatusPage = React.useCallback(() => {
    Linking.openURL(STATUS_PAGE_URL)
  }, [])

  const clearAllStorage = React.useCallback(async () => {
    await clearStorage()
    Toast.show(_(msg`Storage cleared, you need to restart the app now.`))
  }, [_])
  const clearAllLegacyStorage = React.useCallback(async () => {
    await clearLegacyStorage()
    Toast.show(_(msg`Legacy storage cleared, you need to restart the app now.`))
  }, [_])

  return (
    <View style={s.hContentRegion} testID="settingsScreen">
      <SimpleViewHeader
        showBackButton={isMobile}
        style={[
          pal.border,
          {borderBottomWidth: 1},
          !isMobile && {borderLeftWidth: 1, borderRightWidth: 1},
        ]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
            <Trans>Settings</Trans>
          </Text>
        </View>
      </SimpleViewHeader>
      <ScrollView
        style={[s.hContentRegion]}
        contentContainerStyle={isMobile && pal.viewLight}
        scrollIndicatorInsets={{right: 1}}
        // @ts-ignore web only -prf
        dataSet={{'stable-gutters': 1}}>
        <View style={styles.spacer20} />
        {currentAccount ? (
          <>
            <Text type="xl-bold" style={[pal.text, styles.heading]}>
              <Trans>Account</Trans>
            </Text>
            <View style={[styles.infoLine]}>
              <Text type="lg-medium" style={pal.text}>
                <Trans>Email:</Trans>{' '}
              </Text>
              {currentAccount.emailConfirmed && (
                <>
                  <FontAwesomeIcon
                    icon="check"
                    size={10}
                    style={{color: colors.green3, marginRight: 2}}
                  />
                </>
              )}
              <Text
                type="lg"
                numberOfLines={1}
                style={[
                  pal.text,
                  {overflow: 'hidden', marginRight: 4, flex: 1},
                ]}>
                {currentAccount.email || '(no email)'}
              </Text>
              <Link onPress={() => openModal({name: 'change-email'})}>
                <Text type="lg" style={pal.link}>
                  <Trans context="action">Change</Trans>
                </Text>
              </Link>
            </View>
            <View style={[styles.infoLine]}>
              <Text type="lg-medium" style={pal.text}>
                <Trans>Birthday:</Trans>{' '}
              </Text>
              <Link onPress={() => openModal({name: 'birth-date-settings'})}>
                <Text type="lg" style={pal.link}>
                  <Trans>Show</Trans>
                </Text>
              </Link>
            </View>
            <View style={styles.spacer20} />

            {!currentAccount.emailConfirmed && <EmailConfirmationNotice />}
          </>
        ) : null}
        <View style={[s.flexRow, styles.heading]}>
          <Text type="xl-bold" style={pal.text}>
            <Trans>Signed in as</Trans>
          </Text>
          <View style={s.flex1} />
        </View>

        {isSwitchingAccounts ? (
          <View style={[pal.view, styles.linkCard]}>
            <ActivityIndicator />
          </View>
        ) : (
          <SettingsAccountCard account={currentAccount!} />
        )}

        {accounts
          .filter(a => a.did !== currentAccount?.did)
          .map(account => (
            <SettingsAccountCard key={account.did} account={account} />
          ))}

        <TouchableOpacity
          testID="switchToNewAccountBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressAddAccount}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Add account`)}
          accessibilityHint={_(msg`Create a new Bluesky account`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="plus"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Add account</Trans>
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Invite a Friend</Trans>
        </Text>

        <TouchableOpacity
          testID="inviteFriendBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressInviteCodes}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Invite`)}
          accessibilityHint={_(msg`Opens invite code list`)}
          disabled={invites?.disabled}>
          <View
            style={[
              styles.iconContainer,
              invitesAvailable > 0 ? primaryBg : pal.btn,
            ]}>
            <FontAwesomeIcon
              icon="ticket"
              style={
                (invitesAvailable > 0
                  ? primaryText
                  : pal.text) as FontAwesomeIconStyle
              }
            />
          </View>
          <Text type="lg" style={invitesAvailable > 0 ? pal.link : pal.text}>
            {invites?.disabled ? (
              <Trans>
                Your invite codes are hidden when logged in using an App
                Password
              </Trans>
            ) : invitesAvailable === 1 ? (
              <Trans>{invitesAvailable} invite code available</Trans>
            ) : (
              <Trans>{invitesAvailable} invite codes available</Trans>
            )}
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Accessibility</Trans>
        </Text>
        <View style={[pal.view, styles.toggleCard]}>
          <ToggleButton
            type="default-light"
            label={_(msg`Require alt text before posting`)}
            labelType="lg"
            isSelected={requireAltTextEnabled}
            onPress={() => setRequireAltTextEnabled(!requireAltTextEnabled)}
          />
        </View>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Appearance</Trans>
        </Text>
        <View>
          <View style={[styles.linkCard, pal.view, styles.selectableBtns]}>
            <SelectableBtn
              selected={colorMode === 'system'}
              label={_(msg`System`)}
              left
              onSelect={() => setColorMode('system')}
              accessibilityHint={_(msg`Set color theme to system setting`)}
            />
            <SelectableBtn
              selected={colorMode === 'light'}
              label={_(msg`Light`)}
              onSelect={() => setColorMode('light')}
              accessibilityHint={_(msg`Set color theme to light`)}
            />
            <SelectableBtn
              selected={colorMode === 'dark'}
              label={_(msg`Dark`)}
              right
              onSelect={() => setColorMode('dark')}
              accessibilityHint={_(msg`Set color theme to dark`)}
            />
          </View>
        </View>
        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Basics</Trans>
        </Text>
        <TouchableOpacity
          testID="preferencesHomeFeedButton"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={openHomeFeedPreferences}
          accessibilityRole="button"
          accessibilityHint=""
          accessibilityLabel={_(msg`Opens the home feed preferences`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="sliders"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Home Feed Preferences</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="preferencesThreadsButton"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={openThreadsPreferences}
          accessibilityRole="button"
          accessibilityHint=""
          accessibilityLabel={_(msg`Opens the threads preferences`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon={['far', 'comments']}
              style={pal.text as FontAwesomeIconStyle}
              size={18}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Thread Preferences</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="savedFeedsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          accessibilityHint="My Saved Feeds"
          accessibilityLabel={_(msg`Opens screen with all saved feeds`)}
          onPress={onPressSavedFeeds}>
          <View style={[styles.iconContainer, pal.btn]}>
            <HashtagIcon style={pal.text} size={18} strokeWidth={3} />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>My Saved Feeds</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="languageSettingsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressLanguageSettings}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Language settings`)}
          accessibilityHint={_(msg`Opens configurable language settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="language"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Languages</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="moderationBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={
            isSwitchingAccounts
              ? undefined
              : () => navigation.navigate('Moderation')
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`Moderation settings`)}
          accessibilityHint={_(msg`Opens moderation settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <HandIcon style={pal.text} size={18} strokeWidth={6} />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Moderation</Trans>
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Privacy</Trans>
        </Text>

        <TouchableOpacity
          testID="externalEmbedsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={
            isSwitchingAccounts
              ? undefined
              : () => navigation.navigate('PreferencesExternalEmbeds')
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`External media settings`)}
          accessibilityHint={_(msg`Opens external embeds settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon={['far', 'circle-play']}
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>External Media Preferences</Trans>
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Advanced</Trans>
        </Text>
        <TouchableOpacity
          testID="appPasswordBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={onPressAppPasswords}
          accessibilityRole="button"
          accessibilityLabel={_(msg`App password settings`)}
          accessibilityHint={_(msg`Opens the app password settings page`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="lock"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>App passwords</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="changeHandleBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressChangeHandle}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Change handle`)}
          accessibilityHint={_(msg`Choose a new Bluesky username or create`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="at"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text} numberOfLines={1}>
            <Trans>Change handle</Trans>
          </Text>
        </TouchableOpacity>
        {isNative && (
          <View style={[pal.view, styles.toggleCard]}>
            <ToggleButton
              type="default-light"
              label={_(msg`Open links with in-app browser`)}
              labelType="lg"
              isSelected={inAppBrowserPref ?? false}
              onPress={() => setUseInAppBrowser(!inAppBrowserPref)}
            />
          </View>
        )}
        <View style={styles.spacer20} />
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Danger Zone</Trans>
        </Text>
        <TouchableOpacity
          style={[pal.view, styles.linkCard]}
          onPress={onPressDeleteAccount}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Delete account`)}
          accessibilityHint={_(
            msg`Opens modal for account deletion confirmation. Requires email code.`,
          )}>
          <View style={[styles.iconContainer, dangerBg]}>
            <FontAwesomeIcon
              icon={['far', 'trash-can']}
              style={dangerText as FontAwesomeIconStyle}
              size={18}
            />
          </View>
          <Text type="lg" style={dangerText}>
            <Trans>Delete my account…</Trans>
          </Text>
        </TouchableOpacity>
        <View style={styles.spacer20} />
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Developer Tools</Trans>
        </Text>
        <TouchableOpacity
          style={[pal.view, styles.linkCardNoIcon]}
          onPress={onPressSystemLog}
          accessibilityRole="button"
          accessibilityHint="Open system log"
          accessibilityLabel={_(msg`Opens the system log page`)}>
          <Text type="lg" style={pal.text}>
            <Trans>System log</Trans>
          </Text>
        </TouchableOpacity>
        {__DEV__ ? (
          <ToggleButton
            type="default-light"
            label="Experiment: Use AppView Proxy"
            isSelected={debugHeaderEnabled}
            onPress={toggleDebugHeader}
          />
        ) : null}
        {__DEV__ ? (
          <>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={onPressStorybook}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Open storybook page`)}
              accessibilityHint={_(msg`Opens the storybook page`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Storybook</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={onPressResetPreferences}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Reset preferences`)}
              accessibilityHint={_(msg`Resets the preferences state`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Reset preferences state</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={onPressResetOnboarding}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Reset onboarding`)}
              accessibilityHint={_(msg`Resets the onboarding state`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Reset onboarding state</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={clearAllLegacyStorage}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear all legacy storage data`)}
              accessibilityHint={_(msg`Clear all legacy storage data`)}>
              <Text type="lg" style={pal.text}>
                <Trans>
                  Clear all legacy storage data (restart after this)
                </Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={clearAllStorage}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear all storage data`)}
              accessibilityHint={_(msg`Clear all storage data`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Clear all storage data (restart after this)</Trans>
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
        <View style={[styles.footer]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onPressBuildInfo}>
            <Text type="sm" style={[styles.buildInfo, pal.textLight]}>
              <Trans>
                Build version {AppInfo.appVersion} {AppInfo.updateChannel}
              </Trans>
            </Text>
          </TouchableOpacity>
          <Text type="sm" style={[pal.textLight]}>
            &nbsp; &middot; &nbsp;
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onPressStatusPage}>
            <Text type="sm" style={[styles.buildInfo, pal.textLight]}>
              <Trans>Status page</Trans>
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            {flexWrap: 'wrap', gap: 12, paddingHorizontal: 18},
            s.flexRow,
          ]}>
          <TextLink
            type="md"
            style={pal.link}
            href="https://blueskyweb.xyz/support/tos"
            text={_(msg`Terms of Service`)}
          />
          <TextLink
            type="md"
            style={pal.link}
            href="https://blueskyweb.xyz/support/privacy-policy"
            text={_(msg`Privacy Policy`)}
          />
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}

function EmailConfirmationNotice() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {openModal} = useModalControls()

  return (
    <View style={{marginBottom: 20}}>
      <Text type="xl-bold" style={[pal.text, styles.heading]}>
        <Trans>Verify email</Trans>
      </Text>
      <View
        style={[
          {
            paddingVertical: isMobile ? 12 : 0,
            paddingHorizontal: 18,
          },
          pal.view,
        ]}>
        <View style={{flexDirection: 'row', marginBottom: 8}}>
          <Pressable
            style={[
              palInverted.view,
              {
                flexDirection: 'row',
                gap: 6,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                alignItems: 'center',
              },
              isMobile && {flex: 1},
            ]}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Verify my email`)}
            accessibilityHint=""
            onPress={() => openModal({name: 'verify-email'})}>
            <FontAwesomeIcon
              icon="envelope"
              color={palInverted.colors.text}
              size={16}
            />
            <Text type="button" style={palInverted.text}>
              <Trans>Verify My Email</Trans>
            </Text>
          </Pressable>
        </View>
        <Text style={pal.textLight}>
          <Trans>Protect your account by verifying your email.</Trans>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.5,
  },
  spacer20: {
    height: 20,
  },
  heading: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  profile: {
    flexDirection: 'row',
    marginVertical: 6,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  linkCardNoIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  toggleCard: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  avi: {
    marginRight: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  buildInfo: {
    paddingVertical: 8,
  },

  colorModeText: {
    marginLeft: 10,
    marginBottom: 6,
  },

  selectableBtns: {
    flexDirection: 'row',
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
  toggleBtn: {
    paddingHorizontal: 0,
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
  },
})
