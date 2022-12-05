import React, {useState, useEffect, useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {
  useWindowDimensions,
  FlatList,
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import LinearGradient from 'react-native-linear-gradient'
import {GestureDetector, Gesture} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {TABS_ENABLED} from '../../../build-flags'
import {useStores} from '../../../state'
import {NavigationModel} from '../../../state/models/navigation'
import {match, MatchResult} from '../../routes'
import {Login} from '../../screens/Login'
import {Onboard} from '../../screens/Onboard'
import {Modal} from '../../com/modals/Modal'
import {MainMenu} from './MainMenu'
import {TabsSelector} from './TabsSelector'
import {Composer} from './Composer'
import {s, colors} from '../../lib/styles'
import {clamp} from '../../../lib/numbers'
import {
  GridIcon,
  GridIconSolid,
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
} from '../../lib/icons'

const SWIPE_GESTURE_DIST_TRIGGER = 0.3
const SWIPE_GESTURE_VEL_TRIGGER = 2000

const Btn = ({
  icon,
  notificationCount,
  tabCount,
  onPress,
  onLongPress,
}: {
  icon:
    | IconProp
    | 'menu'
    | 'menu-solid'
    | 'home'
    | 'home-solid'
    | 'bell'
    | 'bell-solid'
  notificationCount?: number
  tabCount?: number
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) => {
  let size = 24
  let addedStyles
  let IconEl
  if (icon === 'menu') {
    IconEl = GridIcon
  } else if (icon === 'menu-solid') {
    IconEl = GridIconSolid
  } else if (icon === 'home') {
    IconEl = HomeIcon
    size = 27
  } else if (icon === 'home-solid') {
    IconEl = HomeIconSolid
    size = 27
  } else if (icon === 'bell') {
    IconEl = BellIcon
    size = 27
    addedStyles = {position: 'relative', top: -1} as ViewStyle
  } else if (icon === 'bell-solid') {
    IconEl = BellIconSolid
    size = 27
    addedStyles = {position: 'relative', top: -1} as ViewStyle
  } else {
    IconEl = FontAwesomeIcon
  }

  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}>
      {notificationCount ? (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {tabCount && tabCount > 1 ? (
        <View style={styles.tabCount}>
          <Text style={styles.tabCountLabel}>{tabCount}</Text>
        </View>
      ) : undefined}
      <IconEl size={size} style={[styles.ctrlIcon, addedStyles]} icon={icon} />
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const store = useStores()
  const [isMainMenuActive, setMainMenuActive] = useState(false)
  const [isTabsSelectorActive, setTabsSelectorActive] = useState(false)
  const scrollElRef = useRef<FlatList | undefined>()
  const winDim = useWindowDimensions()
  const swipeGestureInterp = useSharedValue<number>(0)
  const tabMenuInterp = useSharedValue<number>(0)
  const newTabInterp = useSharedValue<number>(0)
  const [isRunningNewTabAnim, setIsRunningNewTabAnim] = useState(false)
  const colorScheme = useColorScheme()
  const safeAreaInsets = useSafeAreaInsets()
  const screenRenderDesc = constructScreenRenderDesc(store.nav)

  const onPressHome = () => {
    if (store.nav.tab.current.url === '/') {
      scrollElRef.current?.scrollToOffset({offset: 0})
    } else {
      if (store.nav.tab.canGoBack) {
        // sanity check
        store.nav.tab.goBackToZero()
      } else {
        store.nav.navigate('/')
      }
    }
  }
  const onPressMenu = () => setMainMenuActive(true)
  const onPressNotifications = () => store.nav.navigate('/notifications')
  const onPressTabs = () => toggleTabsMenu(!isTabsSelectorActive)
  const doNewTab = (url: string) => () => store.nav.newTab(url)

  // tab selector animation
  // =
  const closeTabsSelector = () => setTabsSelectorActive(false)
  const toggleTabsMenu = (active: boolean) => {
    if (active) {
      // will trigger the animation below
      setTabsSelectorActive(true)
    } else {
      tabMenuInterp.value = withTiming(0, {duration: 100}, () => {
        // hide once the animation has finished
        runOnJS(closeTabsSelector)()
      })
    }
  }
  useEffect(() => {
    if (isTabsSelectorActive) {
      // trigger the animation once the tabs selector is rendering
      tabMenuInterp.value = withTiming(1, {duration: 100})
    }
  }, [isTabsSelectorActive])

  // new tab animation
  // =
  useEffect(() => {
    if (screenRenderDesc.hasNewTab && !isRunningNewTabAnim) {
      setIsRunningNewTabAnim(true)
    }
  }, [screenRenderDesc.hasNewTab])
  useEffect(() => {
    if (isRunningNewTabAnim) {
      const reset = () => {
        store.nav.tab.setIsNewTab(false)
        setIsRunningNewTabAnim(false)
      }
      newTabInterp.value = withTiming(
        1,
        {duration: 250, easing: Easing.out(Easing.exp)},
        () => runOnJS(reset)(),
      )
    } else {
      newTabInterp.value = 0
    }
  }, [isRunningNewTabAnim])

  // navigation swipes
  // =
  const goBack = () => store.nav.tab.goBack()
  const swipeGesture = Gesture.Pan()
    .enabled(store.nav.tab.canGoBack)
    .onUpdate(e => {
      if (store.nav.tab.canGoBack) {
        swipeGestureInterp.value = Math.max(e.translationX / winDim.width, 0)
      }
    })
    .onEnd(e => {
      if (
        swipeGestureInterp.value >= SWIPE_GESTURE_DIST_TRIGGER ||
        e.velocityX > SWIPE_GESTURE_VEL_TRIGGER
      ) {
        swipeGestureInterp.value = withTiming(1, {duration: 100}, () => {
          runOnJS(goBack)()
        })
      } else {
        swipeGestureInterp.value = withTiming(0, {duration: 100})
      }
    })
  useEffect(() => {
    // reset the swipe interopolation when the page changes
    swipeGestureInterp.value = 0
  }, [swipeGestureInterp, store.nav.tab.current])

  const swipeTransform = useAnimatedStyle(() => ({
    transform: [{translateX: swipeGestureInterp.value * winDim.width}],
  }))
  const swipeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(swipeGestureInterp.value, [0, 1.0], [0.6, 0.0]),
  }))
  const tabMenuTransform = useAnimatedStyle(() => ({
    transform: [{translateY: tabMenuInterp.value * -320}],
  }))
  const newTabTransform = useAnimatedStyle(() => ({
    transform: [{scale: newTabInterp.value}],
  }))

  if (!store.session.hasSession) {
    return (
      <LinearGradient
        colors={['#007CFF', '#00BCFF']}
        start={{x: 0, y: 0.8}}
        end={{x: 0, y: 1}}
        style={styles.outerContainer}>
        <SafeAreaView style={styles.innerContainer}>
          <Login />
        </SafeAreaView>
        <Modal />
      </LinearGradient>
    )
  }
  if (store.onboard.isOnboarding) {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <Onboard />
        </View>
      </View>
    )
  }

  const isAtHome = store.nav.tab.current.url === '/'
  const isAtNotifications = store.nav.tab.current.url === '/notifications'
  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.innerContainer}>
        <GestureDetector gesture={swipeGesture}>
          <ScreenContainer style={styles.screenContainer}>
            {screenRenderDesc.screens.map(
              ({Com, navIdx, params, key, current, previous}) => {
                return (
                  <Screen
                    key={key}
                    style={[StyleSheet.absoluteFill]}
                    activityState={current ? 2 : previous ? 1 : 0}>
                    <Animated.View
                      style={
                        current ? [styles.screenMask, swipeOpacity] : undefined
                      }
                    />
                    <Animated.View
                      style={[
                        s.flex1,
                        styles.screen,
                        current
                          ? [
                              swipeTransform,
                              tabMenuTransform,
                              isRunningNewTabAnim ? newTabTransform : undefined,
                            ]
                          : undefined,
                      ]}>
                      <Com
                        params={params}
                        navIdx={navIdx}
                        visible={current}
                        scrollElRef={current ? scrollElRef : undefined}
                      />
                    </Animated.View>
                  </Screen>
                )
              },
            )}
          </ScreenContainer>
        </GestureDetector>
      </SafeAreaView>
      {isTabsSelectorActive ? (
        <View
          style={[
            styles.topBarProtector,
            colorScheme === 'dark' ? styles.topBarProtectorDark : undefined,
            {height: safeAreaInsets.top},
          ]}
        />
      ) : undefined}
      <TabsSelector
        active={isTabsSelectorActive}
        tabMenuInterp={tabMenuInterp}
        onClose={() => toggleTabsMenu(false)}
      />
      <View
        style={[
          styles.bottomBar,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 40)},
        ]}>
        <Btn
          icon={isAtHome ? 'home-solid' : 'home'}
          onPress={onPressHome}
          onLongPress={TABS_ENABLED ? doNewTab('/') : undefined}
        />
        {TABS_ENABLED ? (
          <Btn
            icon={isTabsSelectorActive ? 'clone' : ['far', 'clone']}
            onPress={onPressTabs}
            tabCount={store.nav.tabCount}
          />
        ) : undefined}
        <Btn
          icon={isAtNotifications ? 'bell-solid' : 'bell'}
          onPress={onPressNotifications}
          onLongPress={TABS_ENABLED ? doNewTab('/notifications') : undefined}
          notificationCount={store.me.notificationCount}
        />
        <Btn
          icon={isMainMenuActive ? 'menu-solid' : 'menu'}
          onPress={onPressMenu}
        />
      </View>
      <MainMenu
        active={isMainMenuActive}
        insetBottom={clamp(safeAreaInsets.bottom, 15, 40)}
        onClose={() => setMainMenuActive(false)}
      />
      <Modal />
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        onPost={store.shell.composerOpts?.onPost}
      />
    </View>
  )
})

/**
 * This method produces the information needed by the shell to
 * render the current screens with screen-caching behaviors.
 */
type ScreenRenderDesc = MatchResult & {
  key: string
  navIdx: [number, number]
  current: boolean
  previous: boolean
  isNewTab: boolean
}
function constructScreenRenderDesc(nav: NavigationModel): {
  icon: IconProp
  hasNewTab: boolean
  screens: ScreenRenderDesc[]
} {
  let hasNewTab = false
  let icon: IconProp = 'magnifying-glass'
  let screens: ScreenRenderDesc[] = []
  for (const tab of nav.tabs) {
    const tabScreens = [
      ...tab.getBackList(5),
      Object.assign({}, tab.current, {index: tab.index}),
    ]
    const parsedTabScreens = tabScreens.map(screen => {
      const isCurrent = nav.isCurrentScreen(tab.id, screen.index)
      const isPrevious = nav.isCurrentScreen(tab.id, screen.index + 1)
      const matchRes = match(screen.url)
      if (isCurrent) {
        icon = matchRes.icon
      }
      hasNewTab = hasNewTab || tab.isNewTab
      return Object.assign(matchRes, {
        key: `t${tab.id}-s${screen.index}`,
        navIdx: [tab.id, screen.id],
        current: isCurrent,
        previous: isPrevious,
        isNewTab: tab.isNewTab,
      }) as ScreenRenderDesc
    })
    screens = screens.concat(parsedTabScreens)
  }
  return {
    icon,
    hasNewTab,
    screens,
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.gray1,
  },
  screenMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    opacity: 0.5,
  },
  topBarProtector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // will be overwritten by insets
    backgroundColor: colors.white,
  },
  topBarProtectorDark: {
    backgroundColor: colors.black,
  },
  avi: {
    width: 34,
    height: 34,
    marginRight: 8,
    borderRadius: 17,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingTop: 9,
    paddingBottom: 9,
    backgroundColor: colors.gray1,
  },
  locationIcon: {
    color: colors.gray5,
    marginTop: 3,
    marginRight: 6,
  },
  locationIconNudgeUp: {
    marginTop: 2,
  },
  locationIconLight: {
    color: colors.gray5,
    marginTop: 2,
    marginRight: 8,
  },
  locationText: {
    color: colors.black,
  },
  locationTextLight: {
    color: colors.gray4,
  },
  topBarBtn: {
    marginLeft: 8,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingLeft: 5,
    paddingRight: 15,
  },
  ctrl: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 5,
  },
  notificationCount: {
    position: 'absolute',
    left: '60%',
    top: 10,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 8,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabCount: {
    position: 'absolute',
    left: 46,
    top: 30,
  },
  tabCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.black,
  },
  ctrlIcon: {
    color: colors.black,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inactive: {
    color: colors.gray3,
  },
})
