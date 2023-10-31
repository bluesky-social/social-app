import React, {ComponentProps} from 'react'
import {GestureResponderEvent, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {StackActions} from '@react-navigation/native'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics/analytics'
import {clamp} from 'lib/numbers'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  ComposeIcon2,
} from 'lib/icons'
import {usePalette} from 'lib/hooks/usePalette'
import {getTabState, TabState} from 'lib/routes/helpers'
import {styles} from './BottomBarStyles'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useNavigationTabState} from 'lib/hooks/useNavigationTabState'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {BlurView} from '../../com/util/BlurView'
import {alphaBg} from 'lib/styles'

type TabOptions = 'Home' | 'Search' | 'Notifications' | 'MyProfile'

export const BottomBar = observer(function BottomBarImpl({
  navigation,
}: BottomTabBarProps) {
  const store = useStores()
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()
  const {track} = useAnalytics()
  const {isAtHome, isAtSearch, isAtNotifications, isAtMyProfile} =
    useNavigationTabState()

  const {footerMinimalShellTransform} = useMinimalShellMode()
  const {notifications} = store.me

  const onPressTab = React.useCallback(
    (tab: TabOptions) => {
      track(`MobileShell:${tab}ButtonPressed`)
      const state = navigation.getState()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        store.emitScreenSoftReset()
      } else if (tabState === TabState.Inside) {
        navigation.dispatch(StackActions.popToTop())
      } else {
        navigation.navigate(`${tab}Tab`)
      }
    },
    [store, track, navigation],
  )
  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )

  const onPressCompose = React.useCallback(() => {
    store.wordDJModel.clear()
    store.wordDJModel.setManualPayload("What's on your mind?")
    store.wordDJModel.updateAuthoritativeStateForMode()
    navigation.navigate('WordDJScreen')
  }, [navigation, store.wordDJModel])

  const onOpenDrawer = React.useCallback(() => {
    store.shell.openDrawer()
  }, [store])
  return (
    <Animated.View
      style={[
        footerMinimalShellTransform,
        store.shell.minimalShellMode && styles.disabled,
      ]}>
      <BlurView
        style={[
          styles.bottomBar,
          pal.border,
          alphaBg(pal.view, 0.3),
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        ]}
        blurType="light">
        <Btn
          testID="bottomBarHomeBtn"
          showThumb={isAtHome}
          icon={
            isAtHome ? (
              <HomeIconSolid
                strokeWidth={4}
                size={29}
                style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
              />
            ) : (
              <HomeIcon
                strokeWidth={4}
                size={29}
                style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
              />
            )
          }
          label="Feed"
          onPress={onPressHome}
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityHint=""
        />
        <Btn
          testID="bottomBarSearchBtn"
          showThumb={isAtSearch}
          icon={
            isAtSearch ? (
              <MagnifyingGlassIcon2Solid
                size={30}
                style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                strokeWidth={1.8}
              />
            ) : (
              <MagnifyingGlassIcon2
                size={30}
                style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                strokeWidth={1.8}
              />
            )
          }
          label="Search"
          onPress={onPressSearch}
          accessibilityRole="search"
          accessibilityLabel="Search"
          accessibilityHint=""
        />
        <Btn
          testID="bottomBarNotificationsBtn"
          showThumb={isAtNotifications}
          icon={
            <ComposeIcon2
              strokeWidth={1.5}
              size={34}
              style={[pal.text, styles.createIcon]}
            />
          }
          label="Create"
          onPress={onPressCompose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Compose"
          accessibilityHint=""
        />
        <Btn
          testID="bottomBarDrawerBtn"
          showThumb={isAtMyProfile}
          icon={
            <View style={styles.ctrlIconSizingWrapper}>
              <View style={[styles.ctrlIcon, pal.text, styles.profileIcon]}>
                <UserAvatar avatar={store.me.avatar} size={33} />
              </View>
            </View>
          }
          label="Profile"
          notificationCount={notifications.unreadCountLabel}
          onPress={onOpenDrawer}
          accessibilityRole="tab"
          accessibilityLabel="Drawer"
          accessibilityHint=""
        />
        <Btn
          testID="blank"
          showThumb={false}
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
                  {/* <UserAvatar avatar={store.me.avatar} size={32} /> */}
                </View>
              ) : (
                <View style={[styles.ctrlIcon, pal.text, styles.profileIcon]}>
                  {/* <UserAvatar avatar={store.me.avatar} size={28} /> */}
                </View>
              )}
            </View>
          }
          onPress={() => {}}
          accessibilityRole="tab"
          accessibilityLabel="Blank"
          accessibilityHint=""
        />
      </BlurView>
    </Animated.View>
  )
})

interface BtnProps
  extends Pick<
    ComponentProps<typeof TouchableOpacity>,
    | 'accessible'
    | 'accessibilityRole'
    | 'accessibilityHint'
    | 'accessibilityLabel'
  > {
  testID?: string
  showThumb: boolean
  icon: JSX.Element
  label?: string
  notificationCount?: string
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  showThumb,
  icon,
  label,
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
      style={styles.ctrlNoTopPadding}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}>
      <View style={styles.stack}>
        {showThumb ? (
          <View style={styles.thumb} />
        ) : (
          <View style={styles.thumbBlank} />
        )}
        {notificationCount ? (
          <View style={[styles.notificationCount]}>
            <Text style={styles.notificationCountLabel}>
              {notificationCount}
            </Text>
          </View>
        ) : undefined}
        {icon}
      </View>
      <View style={styles.labelView}>
        <Text
          style={showThumb ? styles.labelTextActive : styles.labelTextInactive}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
