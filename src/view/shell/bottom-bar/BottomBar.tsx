import React, {ComponentProps} from 'react'
import {GestureResponderEvent, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {emitSoftReset} from '#/state/events'
import {useModalControls} from '#/state/modals'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {useAnalytics} from 'lib/analytics/analytics'
import {useDedupe} from 'lib/hooks/useDedupe'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useNavigationTabState} from 'lib/hooks/useNavigationTabState'
import {usePalette} from 'lib/hooks/usePalette'
import {
  BellIcon,
  BellIconSolid,
  HashtagIcon,
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
} from 'lib/icons'
import {clamp} from 'lib/numbers'
import {getTabState, TabState} from 'lib/routes/helpers'
import {s} from 'lib/styles'
import {Button} from '#/view/com/util/forms/Button'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {styles} from './BottomBarStyles'

type TabOptions = 'Home' | 'Search' | 'Notifications' | 'MyProfile' | 'Feeds'

export function BottomBar({navigation}: BottomTabBarProps) {
  const {openModal} = useModalControls()
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const {_} = useLingui()
  const safeAreaInsets = useSafeAreaInsets()
  const {track} = useAnalytics()
  const {footerHeight} = useShellLayout()
  const {isAtHome, isAtSearch, isAtFeeds, isAtNotifications, isAtMyProfile} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const {footerMinimalShellTransform} = useMinimalShellMode()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const dedupe = useDedupe()

  const showSignIn = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onPressTab = React.useCallback(
    (tab: TabOptions) => {
      track(`MobileShell:${tab}ButtonPressed`)
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        dedupe(() => navigation.dispatch(StackActions.popToTop()))
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    },
    [track, navigation, dedupe],
  )
  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )
  const onPressFeeds = React.useCallback(
    () => onPressTab('Feeds'),
    [onPressTab],
  )
  const onPressNotifications = React.useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )
  const onPressProfile = React.useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])
  const onLongPressProfile = React.useCallback(() => {
    openModal({name: 'switch-account'})
  }, [openModal])

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        pal.view,
        pal.border,
        {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        footerMinimalShellTransform,
      ]}
      onLayout={e => {
        footerHeight.value = e.nativeEvent.layout.height
      }}>
      {hasSession ? (
        <>
          <Btn
            testID="bottomBarHomeBtn"
            icon={
              isAtHome ? (
                <HomeIconSolid
                  strokeWidth={4}
                  size={24}
                  style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                />
              ) : (
                <HomeIcon
                  strokeWidth={4}
                  size={24}
                  style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                />
              )
            }
            onPress={onPressHome}
            accessibilityRole="tab"
            accessibilityLabel={_(msg`Home`)}
            accessibilityHint=""
          />
          <Btn
            testID="bottomBarSearchBtn"
            icon={
              isAtSearch ? (
                <MagnifyingGlassIcon2Solid
                  size={25}
                  style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  strokeWidth={1.8}
                />
              ) : (
                <MagnifyingGlassIcon2
                  size={25}
                  style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  strokeWidth={1.8}
                />
              )
            }
            onPress={onPressSearch}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
          />
          <Btn
            testID="bottomBarFeedsBtn"
            icon={
              isAtFeeds ? (
                <HashtagIcon
                  size={24}
                  style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  strokeWidth={4}
                />
              ) : (
                <HashtagIcon
                  size={24}
                  style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  strokeWidth={2.25}
                />
              )
            }
            onPress={onPressFeeds}
            accessibilityRole="tab"
            accessibilityLabel={_(msg`Feeds`)}
            accessibilityHint=""
          />
          <Btn
            testID="bottomBarNotificationsBtn"
            icon={
              isAtNotifications ? (
                <BellIconSolid
                  size={24}
                  strokeWidth={1.9}
                  style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                />
              ) : (
                <BellIcon
                  size={24}
                  strokeWidth={1.9}
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
                : `${numUnreadNotifications} unread`
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
                      {borderColor: pal.text.color},
                    ]}>
                    <UserAvatar
                      avatar={profile?.avatar}
                      size={27}
                      // See https://github.com/bluesky-social/social-app/pull/1801:
                      usePlainRNImage={true}
                      type={profile?.associated?.labeler ? 'labeler' : 'user'}
                    />
                  </View>
                ) : (
                  <View style={[styles.ctrlIcon, pal.text, styles.profileIcon]}>
                    <UserAvatar
                      avatar={profile?.avatar}
                      size={28}
                      // See https://github.com/bluesky-social/social-app/pull/1801:
                      usePlainRNImage={true}
                      type={profile?.associated?.labeler ? 'labeler' : 'user'}
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
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Logo width={28} />
              <View style={{paddingTop: 4}}>
                <Logotype width={80} fill={pal.text.color} />
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Button
                onPress={showCreateAccount}
                accessibilityHint={_(msg`Sign up`)}
                accessibilityLabel={_(msg`Sign up`)}>
                <Text type="md" style={[{color: 'white'}, s.bold]}>
                  <Trans>Sign up</Trans>
                </Text>
              </Button>

              <Button
                type="default"
                onPress={showSignIn}
                accessibilityHint={_(msg`Sign in`)}
                accessibilityLabel={_(msg`Sign in`)}>
                <Text type="md" style={[pal.text, s.bold]}>
                  <Trans>Sign in</Trans>
                </Text>
              </Button>
            </View>
          </View>
        </>
      )}
    </Animated.View>
  )
}

interface BtnProps
  extends Pick<
    ComponentProps<typeof TouchableOpacity>,
    | 'accessible'
    | 'accessibilityRole'
    | 'accessibilityHint'
    | 'accessibilityLabel'
  > {
  testID?: string
  icon: JSX.Element
  notificationCount?: string
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  icon,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityHint,
  accessibilityLabel,
}: BtnProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}>
      {notificationCount ? (
        <View style={[styles.notificationCount]}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {icon}
    </TouchableOpacity>
  )
}
