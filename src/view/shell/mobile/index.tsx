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
  View,
  ViewStyle,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import LinearGradient from 'react-native-linear-gradient'
import {GestureDetector, Gesture} from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
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
import {
  GridIcon,
  HomeIcon,
  MangifyingGlassIcon,
  BellIcon,
} from '../../lib/icons'

const SWIPE_GESTURE_DIST_TRIGGER = 0.4
const SWIPE_GESTURE_VEL_TRIGGER = 2500

const Btn = ({
  icon,
  inactive,
  notificationCount,
  onPress,
  onLongPress,
}: {
  icon: IconProp | 'menu' | 'house' | 'bell' | 'search'
  inactive?: boolean
  notificationCount?: number
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) => {
  let size = 21
  let addedStyles
  let IconEl
  if (icon === 'menu') {
    IconEl = GridIcon
  } else if (icon === 'house') {
    IconEl = HomeIcon
    size = 24
  } else if (icon === 'search') {
    IconEl = MangifyingGlassIcon
    size = 24
    addedStyles = {position: 'relative', top: -1} as ViewStyle
  } else if (icon === 'bell') {
    IconEl = BellIcon
    size = 24
    addedStyles = {position: 'relative', top: -1} as ViewStyle
  } else {
    IconEl = FontAwesomeIcon
  }

  if (inactive) {
    return (
      <View style={styles.ctrl}>
        {notificationCount ? (
          <View style={styles.ctrlCount}>
            <Text style={styles.ctrlCountLabel}>{notificationCount}</Text>
          </View>
        ) : undefined}
        <IconEl
          size={size}
          style={[styles.ctrlIcon, styles.inactive, addedStyles]}
          icon={icon}
        />
      </View>
    )
  }
  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}>
      {notificationCount ? (
        <View style={styles.ctrlCount}>
          <Text style={styles.ctrlCountLabel}>{notificationCount}</Text>
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
  const screenRenderDesc = constructScreenRenderDesc(store.nav)

  const onPressHome = () => {
    if (store.nav.tab.current.url === '/') {
      scrollElRef.current?.scrollToOffset({offset: 0})
    } else {
      store.nav.navigate('/')
    }
  }
  const onPressSearch = () => store.nav.navigate('/search')
  const onPressMenu = () => setMainMenuActive(true)
  const onPressNotifications = () => store.nav.navigate('/notifications')
  const onPressTabs = () => setTabsSelectorActive(true)

  const goBack = () => store.nav.tab.goBack()
  const swipeGesture = Gesture.Pan()
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

  if (!store.session.isAuthed) {
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

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.innerContainer}>
        <GestureDetector gesture={swipeGesture}>
          <ScreenContainer style={styles.screenContainer}>
            {screenRenderDesc.screens.map(
              ({Com, params, key, current, previous}) => {
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
                        current ? swipeTransform : undefined,
                      ]}>
                      <Com
                        params={params}
                        visible={true}
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
      <View style={styles.bottomBar}>
        <Btn icon="house" onPress={onPressHome} />
        <Btn icon="search" onPress={onPressSearch} />
        <Btn icon="menu" onPress={onPressMenu} />
        <Btn
          icon="bell"
          onPress={onPressNotifications}
          notificationCount={store.me.notificationCount}
        />
        <Btn icon={['far', 'clone']} onPress={onPressTabs} />
      </View>
      <MainMenu
        active={isMainMenuActive}
        onClose={() => setMainMenuActive(false)}
      />
      <Modal />
      <TabsSelector
        active={isTabsSelectorActive}
        onClose={() => setTabsSelectorActive(false)}
      />
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
  current: boolean
  previous: boolean
}
function constructScreenRenderDesc(nav: NavigationModel): {
  icon: IconProp
  screens: ScreenRenderDesc[]
} {
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
      return Object.assign(matchRes, {
        key: `t${tab.id}-s${screen.index}`,
        current: isCurrent,
        previous: isPrevious,
      }) as ScreenRenderDesc
    })
    screens = screens.concat(parsedTabScreens)
  }
  return {
    icon,
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
  topBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 40,
    paddingBottom: 5,
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
    paddingBottom: 20,
  },
  ctrl: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  ctrlCount: {
    position: 'absolute',
    left: 46,
    top: 10,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 8,
  },
  ctrlCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
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
