import {useCallback} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {useActorStatus} from '#/lib/actor-status'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {BOTTOM_BAR_AVI} from '#/lib/demo'
import {useHaptics} from '#/lib/haptics'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useHideBottomBarBorder} from '#/lib/hooks/useHideBottomBarBorder'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {usePalette} from '#/lib/hooks/usePalette'
import {clamp} from '#/lib/numbers'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {useGate} from '#/lib/statsig/statsig'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled} from '#/components/icons/MagnifyingGlass'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlass} from '#/components/icons/MagnifyingGlass2'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {styles} from './BottomBarStyles'

type TabOptions = 'Home' | 'Search' | 'Messages' | 'Notifications' | 'MyProfile'

export function BottomBar({navigation}: BottomTabBarProps) {
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const {_} = useLingui()
  const safeAreaInsets = useSafeAreaInsets()
  const {footerHeight} = useShellLayout()
  const {isAtHome, isAtSearch, isAtNotifications, isAtMyProfile, isAtMessages} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const dedupe = useDedupe()
  const accountSwitchControl = useDialogControl()
  const playHaptic = useHaptics()
  const hasHomeBadge = useHomeBadge()
  const gate = useGate()
  const hideBorder = useHideBottomBarBorder()
  const iconWidth = 28

  const showSignIn = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onPressTab = useCallback(
    (tab: TabOptions) => {
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        // find the correct navigator in which to pop-to-top
        const target = state.routes.find(route => route.name === `${tab}Tab`)
          ?.state?.key
        dedupe(() => {
          if (target) {
            // if we found it, trigger pop-to-top
            navigation.dispatch({
              ...StackActions.popToTop(),
              target,
            })
          } else {
            // fallback: reset navigation
            navigation.reset({
              index: 0,
              routes: [{name: `${tab}Tab`}],
            })
          }
        })
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    },
    [navigation, dedupe],
  )
  const onPressHome = useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = useCallback(() => onPressTab('Search'), [onPressTab])
  const onPressNotifications = useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )
  const onPressProfile = useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])
  const onPressMessages = useCallback(() => {
    onPressTab('Messages')
  }, [onPressTab])

  const onLongPressProfile = useCallback(() => {
    playHaptic()
    accountSwitchControl.open()
  }, [accountSwitchControl, playHaptic])

  const [demoMode] = useDemoMode()
  const {isActive: live} = useActorStatus(profile)

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />

      <Animated.View
        style={[
          styles.bottomBar,
          pal.view,
          hideBorder ? {borderColor: pal.view.backgroundColor} : pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 60)},
          footerMinimalShellTransform,
        ]}
        onLayout={e => {
          footerHeight.set(e.nativeEvent.layout.height)
        }}>
        {hasSession ? (
          <>
            <Btn
              testID="bottomBarHomeBtn"
              icon={
                isAtHome ? (
                  <HomeFilled
                    width={iconWidth + 1}
                    style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                  />
                ) : (
                  <Home
                    width={iconWidth + 1}
                    style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                  />
                )
              }
              hasNew={hasHomeBadge && gate('remove_show_latest_button')}
              onPress={onPressHome}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Home`)}
              accessibilityHint=""
            />
            <Btn
              icon={
                isAtSearch ? (
                  <MagnifyingGlassFilled
                    width={iconWidth + 2}
                    style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  />
                ) : (
                  <MagnifyingGlass
                    testID="bottomBarSearchBtn"
                    width={iconWidth + 2}
                    style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  />
                )
              }
              onPress={onPressSearch}
              accessibilityRole="search"
              accessibilityLabel={_(msg`Search`)}
              accessibilityHint=""
            />
            <Btn
              testID="bottomBarMessagesBtn"
              icon={
                isAtMessages ? (
                  <MessageFilled
                    width={iconWidth - 1}
                    style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  />
                ) : (
                  <Message
                    width={iconWidth - 1}
                    style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  />
                )
              }
              onPress={onPressMessages}
              notificationCount={numUnreadMessages.numUnread}
              hasNew={numUnreadMessages.hasNew}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Chat`)}
              accessibilityHint={
                numUnreadMessages.count > 0
                  ? _(
                      msg`${plural(numUnreadMessages.numUnread ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      })}` || '',
                    )
                  : ''
              }
            />
            <Btn
              testID="bottomBarNotificationsBtn"
              icon={
                isAtNotifications ? (
                  <BellFilled
                    width={iconWidth}
                    style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                  />
                ) : (
                  <Bell
                    width={iconWidth}
                    style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                  />
                )
              }
              onPress={onPressNotifications}
              notificationCount={numUnreadNotifications}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Notifications`)}
              accessibilityHint={
                numUnreadNotifications === ''
                  ? ''
                  : _(
                      msg`${plural(numUnreadNotifications ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      })}` || '',
                    )
              }
            />
            <Btn
              testID="bottomBarProfileBtn"
              icon={
                <View style={styles.ctrlIconSizingWrapper}>
                  {isAtMyProfile ? (
                    <View
                      style={[
                        styles.ctrlIcon,
                        pal.text,
                        styles.profileIcon,
                        styles.onProfile,
                        {
                          borderColor: pal.text.color,
                          borderWidth: live ? 0 : 1,
                        },
                      ]}>
                      <UserAvatar
                        avatar={demoMode ? BOTTOM_BAR_AVI : profile?.avatar}
                        size={iconWidth - 2}
                        // See https://github.com/bluesky-social/social-app/pull/1801:
                        usePlainRNImage={true}
                        type={profile?.associated?.labeler ? 'labeler' : 'user'}
                        live={live}
                        hideLiveBadge
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.ctrlIcon,
                        pal.text,
                        styles.profileIcon,
                        {
                          borderWidth: live ? 0 : 1,
                        },
                      ]}>
                      <UserAvatar
                        avatar={demoMode ? BOTTOM_BAR_AVI : profile?.avatar}
                        size={iconWidth - 2}
                        // See https://github.com/bluesky-social/social-app/pull/1801:
                        usePlainRNImage={true}
                        type={profile?.associated?.labeler ? 'labeler' : 'user'}
                        live={live}
                        hideLiveBadge
                      />
                    </View>
                  )}
                </View>
              }
              onPress={onPressProfile}
              onLongPress={onLongPressProfile}
              accessibilityRole="tab"
              accessibilityLabel={_(msg`Profile`)}
              accessibilityHint=""
            />
          </>
        ) : (
          <>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                paddingBottom: 2,
                paddingLeft: 14,
                paddingRight: 6,
                gap: 8,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Logo width={28} />
                <View style={{paddingTop: 4}}>
                  <Logotype width={80} fill={pal.text.color} />
                </View>
              </View>

              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                <Button
                  onPress={showCreateAccount}
                  label={_(msg`Create account`)}
                  size="small"
                  variant="solid"
                  color="primary">
                  <ButtonText>
                    <Trans>Create account</Trans>
                  </ButtonText>
                </Button>
                <Button
                  onPress={showSignIn}
                  label={_(msg`Sign in`)}
                  size="small"
                  variant="solid"
                  color="secondary">
                  <ButtonText>
                    <Trans>Sign in</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </>
  )
}

interface BtnProps
  extends Pick<
    React.ComponentProps<typeof PressableScale>,
    | 'accessible'
    | 'accessibilityRole'
    | 'accessibilityHint'
    | 'accessibilityLabel'
  > {
  testID?: string
  icon: JSX.Element
  notificationCount?: string
  hasNew?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  icon,
  hasNew,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityHint,
  accessibilityLabel,
}: BtnProps) {
  return (
    <PressableScale
      testID={testID}
      style={[styles.ctrl, a.flex_1]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      targetScale={0.8}>
      {icon}
      {notificationCount ? (
        <View style={[styles.notificationCount, a.rounded_full]}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : hasNew ? (
        <View style={[styles.hasNewBadge, a.rounded_full]} />
      ) : null}
    </PressableScale>
  )
}
