import React from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {setStringAsync} from 'expo-clipboard'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {appVersion, BUNDLE_DATE, bundleInfo} from '#/lib/app-info'
import {STATUS_PAGE_URL} from '#/lib/constants'
import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {useCustomPalette} from '#/lib/hooks/useCustomPalette'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {HandIcon, HashtagIcon} from '#/lib/icons'
import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {colors, s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {clearStorage} from '#/state/persisted'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import {useDeleteActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useClearPreferencesMutation} from '#/state/queries/preferences'
import {RQKEY as RQKEY_PROFILE} from '#/state/queries/profile'
import {useProfileQuery} from '#/state/queries/profile'
import {SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useOnboardingDispatch, useSetMinimalShellMode} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {AccountDropdownBtn} from '#/view/com/util/AccountDropdownBtn'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
import {Link, TextLink} from '#/view/com/util/Link'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ScrollView} from '#/view/com/util/Views'
import {DeactivateAccountDialog} from '#/screens/Settings/components/DeactivateAccountDialog'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {BirthDateSettingsDialog} from '#/components/dialogs/BirthDateSettings'
import {Email2FAToggle} from './Email2FAToggle'
import {ExportCarDialog} from './ExportCarDialog'

function SettingsAccountCard({
  account,
  pendingDid,
  onPressSwitchAccount,
}: {
  account: SessionAccount
  pendingDid: string | null
  onPressSwitchAccount: (
    account: SessionAccount,
    logContext: 'Settings',
  ) => void
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: account.did})
  const isCurrentAccount = account.did === currentAccount?.did

  const contents = (
    <View
      style={[
        pal.view,
        styles.linkCard,
        account.did === pendingDid && t.atoms.bg_contrast_25,
      ]}>
      <View style={styles.avi}>
        <UserAvatar
          size={40}
          avatar={profile?.avatar}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />
      </View>
      <View style={[s.flex1]}>
        <Text
          emoji
          type="md-bold"
          style={[pal.text, a.self_start]}
          numberOfLines={1}>
          {profile?.displayName || account.handle}
        </Text>
        <Text emoji type="sm" style={pal.textLight} numberOfLines={1}>
          {account.handle}
        </Text>
      </View>
      <AccountDropdownBtn account={account} />
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
        pendingDid ? undefined : () => onPressSwitchAccount(account, 'Settings')
      }
      accessibilityRole="button"
      accessibilityLabel={_(msg`Switch to ${account.handle}`)}
      accessibilityHint={_(msg`Switches the account you are logged in to`)}
      activeOpacity={0.8}>
      {contents}
    </TouchableOpacity>
  )
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()
  const onboardingDispatch = useOnboardingDispatch()
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const {openModal} = useModalControls()
  const {accounts, currentAccount} = useSession()
  const {mutate: clearPreferences} = useClearPreferencesMutation()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const {logoutEveryAccount} = useSessionApi()
  const closeAllActiveElements = useCloseAllActiveElements()
  const exportCarControl = useDialogControl()
  const birthdayControl = useDialogControl()
  const {pendingDid, onPressSwitchAccount} = useAccountSwitcher()
  const isSwitchingAccounts = !!pendingDid

  // const primaryBg = useCustomPalette<ViewStyle>({
  //   light: {backgroundColor: colors.blue0},
  //   dark: {backgroundColor: colors.blue6},
  // })
  // const primaryText = useCustomPalette<TextStyle>({
  //   light: {color: colors.blue3},
  //   dark: {color: colors.blue2},
  // })

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
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressAddAccount = React.useCallback(() => {
    setShowLoggedOut(true)
    closeAllActiveElements()
  }, [setShowLoggedOut, closeAllActiveElements])

  const onPressChangeHandle = React.useCallback(() => {
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
  }, [queryClient, openModal, currentAccount])

  const onPressExportRepository = React.useCallback(() => {
    exportCarControl.open()
  }, [exportCarControl])

  const onPressLanguageSettings = React.useCallback(() => {
    navigation.navigate('LanguageSettings')
  }, [navigation])

  const onPressDeleteAccount = React.useCallback(() => {
    openModal({name: 'delete-account'})
  }, [openModal])

  const onPressLogoutEveryAccount = React.useCallback(() => {
    logoutEveryAccount('Settings')
  }, [logoutEveryAccount])

  const onPressResetPreferences = React.useCallback(async () => {
    clearPreferences()
  }, [clearPreferences])

  const onPressResetOnboarding = React.useCallback(async () => {
    navigation.navigate('Home')
    onboardingDispatch({type: 'start'})
    Toast.show(_(msg`Onboarding reset`))
  }, [navigation, onboardingDispatch, _])

  const onPressBuildInfo = React.useCallback(() => {
    setStringAsync(
      `Build version: ${appVersion}; Bundle info: ${bundleInfo}; Bundle date: ${BUNDLE_DATE}; Platform: ${Platform.OS}`,
    )
    Toast.show(_(msg`Copied build version to clipboard`))
  }, [_])

  const openFollowingFeedPreferences = React.useCallback(() => {
    navigation.navigate('PreferencesFollowingFeed')
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

  const onPressDebugModeration = React.useCallback(() => {
    navigation.navigate('DebugMod')
  }, [navigation])

  const onPressSavedFeeds = React.useCallback(() => {
    navigation.navigate('SavedFeeds')
  }, [navigation])

  const onPressAccessibilitySettings = React.useCallback(() => {
    navigation.navigate('AccessibilitySettings')
  }, [navigation])

  const onPressAppearanceSettings = React.useCallback(() => {
    navigation.navigate('AppearanceSettings')
  }, [navigation])

  const onPressBirthday = React.useCallback(() => {
    birthdayControl.open()
  }, [birthdayControl])

  const clearAllStorage = React.useCallback(async () => {
    await clearStorage()
    Toast.show(_(msg`Storage cleared, you need to restart the app now.`))
  }, [_])

  const deactivateAccountControl = useDialogControl()
  const onPressDeactivateAccount = React.useCallback(() => {
    deactivateAccountControl.open()
  }, [deactivateAccountControl])

  const {mutate: onPressDeleteChatDeclaration} = useDeleteActorDeclaration()

  return (
    <View style={s.hContentRegion} testID="settingsScreen">
      <ExportCarDialog control={exportCarControl} />
      <BirthDateSettingsDialog control={birthdayControl} />

      <SimpleViewHeader
        showBackButton={isMobile}
        style={[
          pal.border,
          {borderBottomWidth: StyleSheet.hairlineWidth},
          !isMobile && {borderLeftWidth: 1, borderRightWidth: 1},
        ]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: '600'}]}>
            <Trans>Settings</Trans>
          </Text>
        </View>
      </SimpleViewHeader>
      <ScrollView
        style={[isMobile && pal.viewLight]}
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
              <Link onPress={onPressBirthday}>
                <Text type="lg" style={pal.link}>
                  <Trans>Show</Trans>
                </Text>
              </Link>
            </View>
            <View style={styles.spacer20} />

            {!currentAccount.emailConfirmed && <EmailConfirmationNotice />}

            <View style={[s.flexRow, styles.heading]}>
              <Text type="xl-bold" style={pal.text} numberOfLines={1}>
                <Trans>Signed in as</Trans>
              </Text>
              <View style={s.flex1} />
            </View>
            <View pointerEvents={pendingDid ? 'none' : 'auto'}>
              <SettingsAccountCard
                account={currentAccount}
                onPressSwitchAccount={onPressSwitchAccount}
                pendingDid={pendingDid}
              />
            </View>
          </>
        ) : null}

        <View pointerEvents={pendingDid ? 'none' : 'auto'}>
          {accounts.length > 1 && (
            <View style={[s.flexRow, styles.heading, a.mt_sm]}>
              <Text type="xl-bold" style={pal.text} numberOfLines={1}>
                <Trans>Other accounts</Trans>
              </Text>
              <View style={s.flex1} />
            </View>
          )}

          {accounts
            .filter(a => a.did !== currentAccount?.did)
            .map(account => (
              <SettingsAccountCard
                key={account.did}
                account={account}
                onPressSwitchAccount={onPressSwitchAccount}
                pendingDid={pendingDid}
              />
            ))}

          <TouchableOpacity
            testID="switchToNewAccountBtn"
            style={[styles.linkCard, pal.view]}
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

          <TouchableOpacity
            style={[styles.linkCard, pal.view]}
            onPress={
              isSwitchingAccounts ? undefined : onPressLogoutEveryAccount
            }
            accessibilityRole="button"
            accessibilityLabel={_(msg`Sign out of all accounts`)}
            accessibilityHint={undefined}>
            <View style={[styles.iconContainer, pal.btn]}>
              <FontAwesomeIcon
                icon="arrow-right-from-bracket"
                style={pal.text as FontAwesomeIconStyle}
              />
            </View>
            <Text type="lg" style={pal.text}>
              {accounts.length > 1 ? (
                <Trans>Sign out of all accounts</Trans>
              ) : (
                <Trans>Sign out</Trans>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer20} />

        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Basics</Trans>
        </Text>
        <TouchableOpacity
          testID="accessibilitySettingsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={
            isSwitchingAccounts ? undefined : onPressAccessibilitySettings
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`Accessibility settings`)}
          accessibilityHint={_(msg`Opens accessibility settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="universal-access"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Accessibility</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="appearanceSettingsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressAppearanceSettings}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Appearance settings`)}
          accessibilityHint={_(msg`Opens appearance settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="paint-roller"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Appearance</Trans>
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
        <TouchableOpacity
          testID="preferencesHomeFeedButton"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={openFollowingFeedPreferences}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Following feed preferences`)}
          accessibilityHint={_(msg`Opens the Following feed preferences`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="sliders"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Following Feed Preferences</Trans>
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
          accessibilityLabel={_(msg`Thread preferences`)}
          accessibilityHint={_(msg`Opens the threads preferences`)}>
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
          onPress={onPressSavedFeeds}
          accessibilityRole="button"
          accessibilityLabel={_(msg`My saved feeds`)}
          accessibilityHint={_(msg`Opens screen with all saved feeds`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <HashtagIcon style={pal.text} size={18} strokeWidth={3} />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>My Saved Feeds</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="linkToChatSettingsBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={
            isSwitchingAccounts
              ? undefined
              : () => navigation.navigate('MessagesSettings')
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`Chat settings`)}
          accessibilityHint={_(msg`Opens chat settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon={['far', 'comment-dots']}
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Chat Settings</Trans>
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
          accessibilityHint={_(msg`Opens the app password settings`)}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="lock"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>App Passwords</Trans>
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
          accessibilityHint={_(
            msg`Opens modal for choosing a new Bluesky handle`,
          )}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="at"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text} numberOfLines={1}>
            <Trans>Change Handle</Trans>
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
          <Trans>Two-factor authentication</Trans>
        </Text>
        <View style={[pal.view, styles.toggleCard]}>
          <Email2FAToggle />
        </View>
        <View style={styles.spacer20} />
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Account</Trans>
        </Text>
        <TouchableOpacity
          testID="changePasswordBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={() => openModal({name: 'change-password'})}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Change password`)}
          accessibilityHint={_(
            msg`Opens modal for changing your Bluesky password`,
          )}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="lock"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text} numberOfLines={1}>
            <Trans>Change Password</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="exportRepositoryBtn"
          style={[
            styles.linkCard,
            pal.view,
            isSwitchingAccounts && styles.dimmed,
          ]}
          onPress={isSwitchingAccounts ? undefined : onPressExportRepository}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Export my data`)}
          accessibilityHint={_(
            msg`Opens modal for downloading your Bluesky account data (repository)`,
          )}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="download"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text} numberOfLines={1}>
            <Trans>Export My Data</Trans>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[pal.view, styles.linkCard]}
          onPress={onPressDeactivateAccount}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Deactivate account`)}
          accessibilityHint={_(
            msg`Opens modal for account deactivation confirmation`,
          )}>
          <View style={[styles.iconContainer, dangerBg]}>
            <FontAwesomeIcon
              icon={'users-slash'}
              style={dangerText as FontAwesomeIconStyle}
              size={18}
            />
          </View>
          <Text type="lg" style={dangerText}>
            <Trans>Deactivate my account</Trans>
          </Text>
        </TouchableOpacity>
        <DeactivateAccountDialog control={deactivateAccountControl} />

        <TouchableOpacity
          style={[pal.view, styles.linkCard]}
          onPress={onPressDeleteAccount}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Delete account`)}
          accessibilityHint={_(
            msg`Opens modal for account deletion confirmation. Requires email code`,
          )}>
          <View style={[styles.iconContainer, dangerBg]}>
            <FontAwesomeIcon
              icon={['far', 'trash-can']}
              style={dangerText as FontAwesomeIconStyle}
              size={18}
            />
          </View>
          <Text type="lg" style={dangerText}>
            <Trans>Delete My Account…</Trans>
          </Text>
        </TouchableOpacity>
        <View style={styles.spacer20} />
        <TouchableOpacity
          style={[pal.view, styles.linkCardNoIcon]}
          onPress={onPressSystemLog}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Open system log`)}
          accessibilityHint={_(msg`Opens the system log page`)}>
          <Text type="lg" style={pal.text}>
            <Trans>System log</Trans>
          </Text>
        </TouchableOpacity>
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
              onPress={onPressDebugModeration}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Open storybook page`)}
              accessibilityHint={_(msg`Opens the storybook page`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Debug Moderation</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={onPressResetPreferences}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Reset preferences state`)}
              accessibilityHint={_(msg`Resets the preferences state`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Reset preferences state</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={() => onPressDeleteChatDeclaration()}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Delete chat declaration record`)}
              accessibilityHint={_(msg`Deletes the chat declaration record`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Delete chat declaration record</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={onPressResetOnboarding}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Reset onboarding state`)}
              accessibilityHint={_(msg`Resets the onboarding state`)}>
              <Text type="lg" style={pal.text}>
                <Trans>Reset onboarding state</Trans>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pal.view, styles.linkCardNoIcon]}
              onPress={clearAllStorage}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear all storage data`)}
              accessibilityHint={_(msg`Clears all storage data`)}>
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
                Version {appVersion} {bundleInfo}
              </Trans>
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
            href="https://bsky.social/about/support/tos"
            text={_(msg`Terms of Service`)}
          />
          <TextLink
            type="md"
            style={pal.link}
            href="https://bsky.social/about/support/privacy-policy"
            text={_(msg`Privacy Policy`)}
          />
          <TextLink
            type="md"
            style={pal.link}
            href={STATUS_PAGE_URL}
            text={_(msg`Status Page`)}
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
            accessibilityHint={_(msg`Opens modal for email verification`)}
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
    paddingLeft: 18,
  },
})
