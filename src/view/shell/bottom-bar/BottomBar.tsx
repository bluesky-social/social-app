import React, {ComponentProps} from 'react'
import {GestureResponderEvent, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {StackActions} from '@react-navigation/native'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Text} from 'view/com/util/text/Text'
import {useAnalytics} from 'lib/analytics/analytics'
import {clamp} from 'lib/numbers'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  HashtagIcon,
  BellIcon,
  BellIconSolid,
} from 'lib/icons'
import {usePalette} from 'lib/hooks/usePalette'
import {getTabState, TabState} from 'lib/routes/helpers'
import {styles} from './BottomBarStyles'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useNavigationTabState} from 'lib/hooks/useNavigationTabState'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useModalControls} from '#/state/modals'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'

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

  const onPressTab = React.useCallback(
    (tab: TabOptions) => {
      track(`MobileShell:${tab}ButtonPressed`)
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        navigation.dispatch(StackActions.popToTop())
      } else {
        navigation.navigate(`${tab}Tab`)
      }
    },
    [track, navigation],
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

      {hasSession && (
        <>
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
                    />
                  </View>
                ) : (
                  <View style={[styles.ctrlIcon, pal.text, styles.profileIcon]}>
                    <UserAvatar
                      avatar={profile?.avatar}
                      size={28}
                      // See https://github.com/bluesky-social/social-app/pull/1801:
                      usePlainRNImage={true}
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
