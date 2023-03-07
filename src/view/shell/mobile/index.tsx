import React, {useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from 'state/index'
import {NavigationModel} from 'state/models/navigation'
import {match, MatchResult} from '../../routes'
import {Login} from '../../screens/Login'
import {Menu} from './Menu'
import {BottomBar} from './BottomBar'
import {HorzSwipe} from '../../com/util/gestures/HorzSwipe'
import {ModalsContainer} from '../../com/modals/Modal'
import {Lightbox} from '../../com/lightbox/Lightbox'
import {Text} from '../../com/util/text/Text'
import {ErrorBoundary} from '../../com/util/ErrorBoundary'
import {Composer} from './Composer'
import {s, colors} from 'lib/styles'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'

export const MobileShell: React.FC = observer(() => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const winDim = useWindowDimensions()
  const [menuSwipingDirection, setMenuSwipingDirection] = useState(0)
  const swipeGestureInterp = useAnimatedValue(0)
  const safeAreaInsets = useSafeAreaInsets()
  const screenRenderDesc = constructScreenRenderDesc(store.nav)

  // navigation swipes
  // =
  const isMenuActive = store.shell.isMainMenuOpen
  const canSwipeLeft = store.nav.tab.canGoBack || !isMenuActive
  const canSwipeRight = isMenuActive
  const onNavSwipeStartDirection = (dx: number) => {
    if (dx < 0 && !store.nav.tab.canGoBack) {
      setMenuSwipingDirection(dx)
    } else if (dx > 0 && isMenuActive) {
      setMenuSwipingDirection(dx)
    } else {
      setMenuSwipingDirection(0)
    }
  }
  const onNavSwipeEnd = (dx: number) => {
    if (dx < 0) {
      if (store.nav.tab.canGoBack) {
        store.nav.tab.goBack()
      } else {
        store.shell.setMainMenuOpen(true)
      }
    } else if (dx > 0) {
      if (isMenuActive) {
        store.shell.setMainMenuOpen(false)
      }
    }
    setMenuSwipingDirection(0)
  }
  const swipeTranslateX = Animated.multiply(
    swipeGestureInterp,
    winDim.width * -1,
  )
  const swipeTransform = store.nav.tab.canGoBack
    ? {transform: [{translateX: swipeTranslateX}]}
    : undefined
  let shouldRenderMenu = false
  let menuTranslateX
  const menuDrawerWidth = winDim.width - 100
  if (isMenuActive) {
    // menu is active, interpret swipes as closes
    menuTranslateX = Animated.multiply(swipeGestureInterp, menuDrawerWidth * -1)
    shouldRenderMenu = true
  } else if (!store.nav.tab.canGoBack) {
    // at back of history, interpret swipes as opens
    menuTranslateX = Animated.subtract(
      menuDrawerWidth * -1,
      Animated.multiply(swipeGestureInterp, menuDrawerWidth),
    )
    shouldRenderMenu = true
  }
  const menuSwipeTransform = menuTranslateX
    ? {
        transform: [{translateX: menuTranslateX}],
      }
    : undefined
  const swipeOpacity = {
    opacity: swipeGestureInterp.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 0.6, 0],
    }),
  }
  const menuSwipeOpacity =
    menuSwipingDirection !== 0
      ? {
          opacity: swipeGestureInterp.interpolate({
            inputRange: menuSwipingDirection > 0 ? [0, 1] : [-1, 0],
            outputRange: [0.6, 0],
          }),
        }
      : undefined

  if (store.hackUpgradeNeeded) {
    return (
      <View style={styles.outerContainer}>
        <View style={[s.flexCol, s.p20, s.h100pct]}>
          <View style={s.flex1} />
          <View>
            <Text type="title-2xl" style={s.pb10}>
              Update required
            </Text>
            <Text style={[s.pb20, s.bold]}>
              Please update your app to the latest version. If no update is
              available yet, please check the App Store in a day or so.
            </Text>
            <Text type="title" style={s.pb10}>
              What's happening?
            </Text>
            <Text style={s.pb10}>
              We're in the final stages of the AT Protocol's v1 development. To
              make sure everything works as well as possible, we're making final
              breaking changes to the APIs.
            </Text>
            <Text>
              If we didn't botch this process, a new version of the app should
              be available now.
            </Text>
          </View>
          <View style={s.flex1} />
          <View style={s.footerSpacer} />
        </View>
      </View>
    )
  }

  if (!store.session.hasSession) {
    return (
      <View style={styles.outerContainer}>
        <StatusBar
          barStyle={
            theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'
          }
        />
        <Login />
        <ModalsContainer />
      </View>
    )
  }

  const screenBg = {
    backgroundColor: theme.colorScheme === 'dark' ? colors.black : colors.gray1,
  }
  return (
    <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
      <StatusBar
        barStyle={
          theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'
        }
      />
      <View style={[styles.innerContainer, {paddingTop: safeAreaInsets.top}]}>
        <HorzSwipe
          distThresholdDivisor={2.5}
          useNativeDriver
          panX={swipeGestureInterp}
          swipeEnabled
          canSwipeLeft={canSwipeLeft}
          canSwipeRight={canSwipeRight}
          onSwipeStartDirection={onNavSwipeStartDirection}
          onSwipeEnd={onNavSwipeEnd}>
          <ScreenContainer style={styles.screenContainer}>
            {screenRenderDesc.screens.map(
              ({Com, navIdx, params, key, current, previous}) => {
                if (isMenuActive) {
                  // HACK menu is active, treat current as previous
                  if (previous) {
                    previous = false
                  } else if (current) {
                    current = false
                    previous = true
                  }
                }
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
                        s.h100pct,
                        screenBg,
                        current ? [swipeTransform] : undefined,
                      ]}>
                      <ErrorBoundary>
                        <Com
                          params={params}
                          navIdx={navIdx}
                          visible={current}
                        />
                      </ErrorBoundary>
                    </Animated.View>
                  </Screen>
                )
              },
            )}
          </ScreenContainer>
          <BottomBar />
          {isMenuActive || menuSwipingDirection !== 0 ? (
            <TouchableWithoutFeedback
              onPress={() => store.shell.setMainMenuOpen(false)}>
              <Animated.View style={[styles.screenMask, menuSwipeOpacity]} />
            </TouchableWithoutFeedback>
          ) : undefined}
          {shouldRenderMenu && (
            <Animated.View style={[styles.menuDrawer, menuSwipeTransform]}>
              <Menu onClose={() => store.shell.setMainMenuOpen(false)} />
            </Animated.View>
          )}
        </HorzSwipe>
      </View>
      <ModalsContainer />
      <Lightbox />
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        imagesOpen={store.shell.composerOpts?.imagesOpen}
        onPost={store.shell.composerOpts?.onPost}
        quote={store.shell.composerOpts?.quote}
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
  navIdx: string
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
        navIdx: `${tab.id}-${screen.id}`,
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
  },
  innerContainer: {
    height: '100%',
  },
  screenContainer: {
    height: '100%',
  },
  screenMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  menuDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 100,
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
})
