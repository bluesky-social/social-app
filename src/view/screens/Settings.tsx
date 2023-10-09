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
import {
  useFocusEffect,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import * as AppInfo from 'lib/app-info'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {ScrollView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
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
import {pluralize} from 'lib/strings/helpers'
import {HandIcon, HashtagIcon} from 'lib/icons'
import {formatCount} from 'view/com/util/numeric/format'
import Clipboard from '@react-native-clipboard/clipboard'
import {makeProfileLink} from 'lib/routes/links'
import {AccountDropdownBtn} from 'view/com/util/AccountDropdownBtn'

// TEMPORARY (APP-700)
// remove after backend testing finishes
// -prf
import {useDebugHeaderSetting} from 'lib/api/debug-appview-proxy-header'
import {STATUS_PAGE_URL} from 'lib/constants'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export const SettingsScreen = withAuthRequired(
  observer(function Settings({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()
    const {isMobile} = useWebMediaQueries()
    const {screen, track} = useAnalytics()
    const [isSwitching, setIsSwitching, onPressSwitchAccount] =
      useAccountSwitcher()
    const [debugHeaderEnabled, toggleDebugHeader] = useDebugHeaderSetting(
      store.agent,
    )

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
        store.shell.setMinimalShellMode(false)
      }, [screen, store]),
    )

    const onPressAddAccount = React.useCallback(() => {
      track('Settings:AddAccountButtonClicked')
      navigation.navigate('HomeTab')
      navigation.dispatch(StackActions.popToTop())
      store.session.clear()
    }, [track, navigation, store])

    const onPressChangeHandle = React.useCallback(() => {
      track('Settings:ChangeHandleButtonClicked')
      store.shell.openModal({
        name: 'change-handle',
        onChanged() {
          setIsSwitching(true)
          store.session.reloadFromServer().then(
            () => {
              setIsSwitching(false)
              Toast.show('Your handle has been updated')
            },
            err => {
              store.log.error(
                'Failed to reload from server after handle update',
                {err},
              )
              setIsSwitching(false)
            },
          )
        },
      })
    }, [track, store, setIsSwitching])

    const onPressInviteCodes = React.useCallback(() => {
      track('Settings:InvitecodesButtonClicked')
      store.shell.openModal({name: 'invite-codes'})
    }, [track, store])

    const onPressLanguageSettings = React.useCallback(() => {
      navigation.navigate('LanguageSettings')
    }, [navigation])

    const onPressSignout = React.useCallback(() => {
      track('Settings:SignOutButtonClicked')
      store.session.logout()
    }, [track, store])

    const onPressDeleteAccount = React.useCallback(() => {
      store.shell.openModal({name: 'delete-account'})
    }, [store])

    const onPressResetPreferences = React.useCallback(async () => {
      await store.preferences.reset()
      Toast.show('Preferences reset')
    }, [store])

    const onPressResetOnboarding = React.useCallback(async () => {
      store.onboarding.reset()
      Toast.show('Onboarding reset')
    }, [store])

    const onPressBuildInfo = React.useCallback(() => {
      Clipboard.setString(
        `Build version: ${AppInfo.appVersion}; Platform: ${Platform.OS}`,
      )
      Toast.show('Copied build version to clipboard')
    }, [])

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

    return (
      <View style={[s.hContentRegion]} testID="settingsScreen">
        <ViewHeader title="Settings" />
        <ScrollView
          style={[s.hContentRegion]}
          contentContainerStyle={isMobile && pal.viewLight}
          scrollIndicatorInsets={{right: 1}}>
          <View style={styles.spacer20} />
          {store.session.currentSession !== undefined ? (
            <>
              <Text type="xl-bold" style={[pal.text, styles.heading]}>
                Account
              </Text>
              <View style={[styles.infoLine]}>
                <Text type="lg-medium" style={pal.text}>
                  Email:{' '}
                </Text>
                {!store.session.emailNeedsConfirmation && (
                  <>
                    <FontAwesomeIcon
                      icon="check"
                      size={10}
                      style={{color: colors.green3, marginRight: 2}}
                    />
                  </>
                )}
                <Text type="lg" style={pal.text}>
                  {store.session.currentSession?.email}{' '}
                </Text>
                <Link
                  onPress={() => store.shell.openModal({name: 'change-email'})}>
                  <Text type="lg" style={pal.link}>
                    Change
                  </Text>
                </Link>
              </View>
              <View style={[styles.infoLine]}>
                <Text type="lg-medium" style={pal.text}>
                  Birthday:{' '}
                </Text>
                <Link
                  onPress={() =>
                    store.shell.openModal({name: 'birth-date-settings'})
                  }>
                  <Text type="lg" style={pal.link}>
                    Show
                  </Text>
                </Link>
              </View>
              <View style={styles.spacer20} />
              <EmailConfirmationNotice />
            </>
          ) : null}
          <View style={[s.flexRow, styles.heading]}>
            <Text type="xl-bold" style={pal.text}>
              Signed in as
            </Text>
            <View style={s.flex1} />
          </View>
          {isSwitching ? (
            <View style={[pal.view, styles.linkCard]}>
              <ActivityIndicator />
            </View>
          ) : (
            <Link
              href={makeProfileLink(store.me)}
              title="Your profile"
              noFeedback>
              <View style={[pal.view, styles.linkCard]}>
                <View style={styles.avi}>
                  <UserAvatar size={40} avatar={store.me.avatar} />
                </View>
                <View style={[s.flex1]}>
                  <Text type="md-bold" style={pal.text} numberOfLines={1}>
                    {store.me.displayName || store.me.handle}
                  </Text>
                  <Text type="sm" style={pal.textLight} numberOfLines={1}>
                    {store.me.handle}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="signOutBtn"
                  onPress={isSwitching ? undefined : onPressSignout}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                  accessibilityHint={`Signs ${store.me.displayName} out of Bluesky`}>
                  <Text type="lg" style={pal.link}>
                    Sign out
                  </Text>
                </TouchableOpacity>
              </View>
            </Link>
          )}
          {store.session.switchableAccounts.map(account => (
            <TouchableOpacity
              testID={`switchToAccountBtn-${account.handle}`}
              key={account.did}
              style={[pal.view, styles.linkCard, isSwitching && styles.dimmed]}
              onPress={
                isSwitching ? undefined : () => onPressSwitchAccount(account)
              }
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${account.handle}`}
              accessibilityHint="Switches the account you are logged in to">
              <View style={styles.avi}>
                <UserAvatar size={40} avatar={account.aviUrl} />
              </View>
              <View style={[s.flex1]}>
                <Text type="md-bold" style={pal.text}>
                  {account.displayName || account.handle}
                </Text>
                <Text type="sm" style={pal.textLight}>
                  {account.handle}
                </Text>
              </View>
              <AccountDropdownBtn handle={account.handle} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            testID="switchToNewAccountBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={isSwitching ? undefined : onPressAddAccount}
            accessibilityRole="button"
            accessibilityLabel="Add account"
            accessibilityHint="Create a new Bluesky account">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="plus"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text}>
              Add account
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer20} />

          {store.me.invitesAvailable !== null && (
            <>
              <Text type="xl-bold" style={[pal.text, styles.heading]}>
                Invite a Friend
              </Text>
              <TouchableOpacity
                testID="inviteFriendBtn"
                style={[
                  styles.linkCard,
                  pal.view,
                  isSwitching && styles.dimmed,
                ]}
                onPress={isSwitching ? undefined : onPressInviteCodes}
                accessibilityRole="button"
                accessibilityLabel="Invite"
                accessibilityHint="Opens invite code list">
                <View
                  style={[
                    styles.iconContainer,
                    store.me.invitesAvailable > 0 ? primaryBg : pal.btn,
                  ]}>
                  <FontAwesomeIcon
                    icon="ticket"
                    style={
                      (store.me.invitesAvailable > 0
                        ? primaryText
                        : pal.text) as FontAwesomeIconStyle
                    }
                  />
                </View>
                <Text
                  type="lg"
                  style={store.me.invitesAvailable > 0 ? pal.link : pal.text}>
                  {formatCount(store.me.invitesAvailable)} invite{' '}
                  {pluralize(store.me.invitesAvailable, 'code')} available
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.spacer20} />

          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Accessibility
          </Text>
          <View style={[pal.view, styles.toggleCard]}>
            <ToggleButton
              type="default-light"
              label="Require alt text before posting"
              labelType="lg"
              isSelected={store.preferences.requireAltTextEnabled}
              onPress={store.preferences.toggleRequireAltTextEnabled}
            />
          </View>

          <View style={styles.spacer20} />

          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Appearance
          </Text>
          <View>
            <View style={[styles.linkCard, pal.view, styles.selectableBtns]}>
              <SelectableBtn
                selected={store.shell.colorMode === 'system'}
                label="System"
                left
                onSelect={() => store.shell.setColorMode('system')}
                accessibilityHint="Set color theme to system setting"
              />
              <SelectableBtn
                selected={store.shell.colorMode === 'light'}
                label="Light"
                onSelect={() => store.shell.setColorMode('light')}
                accessibilityHint="Set color theme to light"
              />
              <SelectableBtn
                selected={store.shell.colorMode === 'dark'}
                label="Dark"
                right
                onSelect={() => store.shell.setColorMode('dark')}
                accessibilityHint="Set color theme to dark"
              />
            </View>
          </View>
          <View style={styles.spacer20} />

          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Basics
          </Text>
          <TouchableOpacity
            testID="preferencesHomeFeedButton"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={openHomeFeedPreferences}
            accessibilityRole="button"
            accessibilityHint=""
            accessibilityLabel="Opens the home feed preferences">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="sliders"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text}>
              Home Feed Preferences
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="preferencesThreadsButton"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={openThreadsPreferences}
            accessibilityRole="button"
            accessibilityHint=""
            accessibilityLabel="Opens the threads preferences">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon={['far', 'comments']}
                style={pal.text as FontAwesomeIconStyle}
                size={18}
              />
            </View>
            <Text type="lg" style={pal.text}>
              Thread Preferences
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="savedFeedsBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            accessibilityHint="My Saved Feeds"
            accessibilityLabel="Opens screen with all saved feeds"
            onPress={onPressSavedFeeds}>
            <View style={[styles.iconContainer, pal.btn]}>
              <HashtagIcon style={pal.text} size={18} strokeWidth={3} />
            </View>
            <Text type="lg" style={pal.text}>
              My Saved Feeds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="languageSettingsBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={isSwitching ? undefined : onPressLanguageSettings}
            accessibilityRole="button"
            accessibilityHint="Language settings"
            accessibilityLabel="Opens configurable language settings">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="language"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text}>
              Languages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="moderationBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={
              isSwitching ? undefined : () => navigation.navigate('Moderation')
            }
            accessibilityRole="button"
            accessibilityHint=""
            accessibilityLabel="Opens moderation settings">
            <View style={[styles.iconContainer, pal.btn]}>
              <HandIcon style={pal.text} size={18} strokeWidth={6} />
            </View>
            <Text type="lg" style={pal.text}>
              Moderation
            </Text>
          </TouchableOpacity>
          <View style={styles.spacer20} />

          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Advanced
          </Text>
          <TouchableOpacity
            testID="appPasswordBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={onPressAppPasswords}
            accessibilityRole="button"
            accessibilityHint="Open app password settings"
            accessibilityLabel="Opens the app password settings page">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="lock"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text}>
              App passwords
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="changeHandleBtn"
            style={[styles.linkCard, pal.view, isSwitching && styles.dimmed]}
            onPress={isSwitching ? undefined : onPressChangeHandle}
            accessibilityRole="button"
            accessibilityLabel="Change handle"
            accessibilityHint="Choose a new Bluesky username or create">
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="at"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text} numberOfLines={1}>
              Change handle
            </Text>
          </TouchableOpacity>
          <View style={styles.spacer20} />
          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Danger Zone
          </Text>
          <TouchableOpacity
            style={[pal.view, styles.linkCard]}
            onPress={onPressDeleteAccount}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            accessibilityHint="Opens modal for account deletion confirmation. Requires email code.">
            <View style={[styles.iconContainer, dangerBg]}>
              <FontAwesomeIcon
                icon={['far', 'trash-can']}
                style={dangerText as FontAwesomeIconStyle}
                size={18}
              />
            </View>
            <Text type="lg" style={dangerText}>
              Delete my account…
            </Text>
          </TouchableOpacity>
          <View style={styles.spacer20} />
          <Text type="xl-bold" style={[pal.text, styles.heading]}>
            Developer Tools
          </Text>
          <TouchableOpacity
            style={[pal.view, styles.linkCardNoIcon]}
            onPress={onPressSystemLog}
            accessibilityRole="button"
            accessibilityHint="Open system log"
            accessibilityLabel="Opens the system log page">
            <Text type="lg" style={pal.text}>
              System log
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
                accessibilityHint="Open storybook page"
                accessibilityLabel="Opens the storybook page">
                <Text type="lg" style={pal.text}>
                  Storybook
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pal.view, styles.linkCardNoIcon]}
                onPress={onPressResetPreferences}
                accessibilityRole="button"
                accessibilityHint="Reset preferences"
                accessibilityLabel="Resets the preferences state">
                <Text type="lg" style={pal.text}>
                  Reset preferences state
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pal.view, styles.linkCardNoIcon]}
                onPress={onPressResetOnboarding}
                accessibilityRole="button"
                accessibilityHint="Reset onboarding"
                accessibilityLabel="Resets the onboarding state">
                <Text type="lg" style={pal.text}>
                  Reset onboarding state
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
          <View style={[styles.footer]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressBuildInfo}>
              <Text type="sm" style={[styles.buildInfo, pal.textLight]}>
                Build version {AppInfo.appVersion} {AppInfo.updateChannel}
              </Text>
            </TouchableOpacity>
            <Text type="sm" style={[pal.textLight]}>
              &middot; &nbsp;
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressStatusPage}>
              <Text type="sm" style={[styles.buildInfo, pal.textLight]}>
                Status page
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.footerSpacer} />
        </ScrollView>
      </View>
    )
  }),
)

const EmailConfirmationNotice = observer(
  function EmailConfirmationNoticeImpl() {
    const pal = usePalette('default')
    const palInverted = usePalette('inverted')
    const store = useStores()
    const {isMobile} = useWebMediaQueries()

    if (!store.session.emailNeedsConfirmation) {
      return null
    }

    return (
      <View style={{marginBottom: 20}}>
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          Verify email
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
              accessibilityLabel="Verify my email"
              accessibilityHint=""
              onPress={() => store.shell.openModal({name: 'verify-email'})}>
              <FontAwesomeIcon
                icon="envelope"
                color={palInverted.colors.text}
                size={16}
              />
              <Text type="button" style={palInverted.text}>
                Verify My Email
              </Text>
            </Pressable>
          </View>
          <Text style={pal.textLight}>
            Protect your account by verifying your email.
          </Text>
        </View>
      </View>
    )
  },
)

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
