import React from 'react'
import {
  Animated,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {FeedModel} from 'state/models/feed-view'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from '../com/posts/Feed'
import {FollowingEmptyState} from 'view/com/posts/FollowingEmptyState'
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {TabBar} from 'view/com/util/TabBar'
import {
  Pager,
  PageSelectedEvent,
  RenderTabBarFnProps,
} from 'view/com/util/Pager'
import {FAB} from '../com/util/FAB'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'
import {clamp} from 'lodash'

const TAB_BAR_HEIGHT = 82
const BOTTOM_BAR_HEIGHT = 48

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired((_opts: Props) => {
  const store = useStores()
  const [selectedPage, setSelectedPage] = React.useState(0)

  const algoFeed = React.useMemo(() => {
    const feed = new FeedModel(store, 'goodstuff', {})
    feed.setup()
    return feed
  }, [store])

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setIsDrawerSwipeDisabled(selectedPage > 0)
      return () => {
        store.shell.setIsDrawerSwipeDisabled(false)
      }
    }, [store, selectedPage]),
  )

  const onPageSelected = React.useCallback(
    (e: PageSelectedEvent) => {
      setSelectedPage(e.nativeEvent.position)
      store.shell.setIsDrawerSwipeDisabled(e.nativeEvent.position > 0)
    },
    [store],
  )

  const onPressSelected = React.useCallback(() => {
    store.emitScreenSoftReset()
  }, [store])

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return <FloatingTabBar {...props} onPressSelected={onPressSelected} />
    },
    [onPressSelected],
  )

  const renderFollowingEmptyState = React.useCallback(() => {
    return <FollowingEmptyState />
  }, [])

  const initialPage = store.me.follows.isEmpty ? 1 : 0
  return (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={renderTabBar}
      tabBarPosition="bottom"
      initialPage={initialPage}>
      <FeedPage
        key="1"
        isPageFocused={selectedPage === 0}
        feed={store.me.mainFeed}
        renderEmptyState={renderFollowingEmptyState}
      />
      <FeedPage key="2" isPageFocused={selectedPage === 1} feed={algoFeed} />
    </Pager>
  )
})

const FloatingTabBar = observer(
  (props: RenderTabBarFnProps & {onPressSelected: () => void}) => {
    const store = useStores()
    const safeAreaInsets = useSafeAreaInsets()
    const pal = usePalette('default')
    const interp = useAnimatedValue(0)

    const pad = React.useMemo(
      () => ({
        paddingBottom: clamp(safeAreaInsets.bottom, 15, 20),
      }),
      [safeAreaInsets],
    )

    React.useEffect(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 0 : 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }, [interp, store.shell.minimalShellMode])
    const transform = {
      transform: [
        {translateY: Animated.multiply(interp, -1 * BOTTOM_BAR_HEIGHT)},
      ],
    }

    return (
      <Animated.View
        style={[pal.view, pal.border, styles.tabBar, pad, transform]}>
        <TabBar
          {...props}
          items={['Following', "What's hot"]}
          indicatorPosition="top"
          indicatorColor={pal.colors.link}
        />
      </Animated.View>
    )
  },
)

const FeedPage = observer(
  ({
    isPageFocused,
    feed,
    renderEmptyState,
  }: {
    feed: FeedModel
    isPageFocused: boolean
    renderEmptyState?: () => JSX.Element
  }) => {
    const store = useStores()
    const onMainScroll = useOnMainScroll(store)
    const {screen, track} = useAnalytics()
    const scrollElRef = React.useRef<FlatList>(null)
    const {appState} = useAppState({
      onForeground: () => doPoll(true),
    })
    const isScreenFocused = useIsFocused()
    const winDim = useWindowDimensions()
    const containerStyle = React.useMemo(
      () => ({height: winDim.height - TAB_BAR_HEIGHT}),
      [winDim],
    )

    const doPoll = React.useCallback(
      (knownActive = false) => {
        if (
          (!knownActive && appState !== 'active') ||
          !isScreenFocused ||
          !isPageFocused
        ) {
          return
        }
        if (feed.isLoading) {
          return
        }
        store.log.debug('HomeScreen: Polling for new posts')
        feed.checkForLatest()
      },
      [appState, isScreenFocused, isPageFocused, store, feed],
    )

    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: 0})
    }, [scrollElRef])

    const onSoftReset = React.useCallback(() => {
      if (isPageFocused) {
        scrollToTop()
      }
    }, [isPageFocused, scrollToTop])

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const feedCleanup = feed.registerListeners()
        const pollInterval = setInterval(doPoll, 15e3)

        screen('Feed')
        store.log.debug('HomeScreen: Updating feed')
        if (feed.hasContent) {
          feed.update()
        }

        return () => {
          clearInterval(pollInterval)
          softResetSub.remove()
          feedCleanup()
        }
      }, [store, doPoll, onSoftReset, screen, feed]),
    )

    const onPressCompose = React.useCallback(() => {
      track('HomeScreen:PressCompose')
      store.shell.openComposer({})
    }, [store, track])

    const onPressTryAgain = React.useCallback(() => {
      feed.refresh()
    }, [feed])

    const onPressLoadLatest = React.useCallback(() => {
      feed.refresh()
      scrollToTop()
    }, [feed, scrollToTop])

    return (
      <View style={containerStyle}>
        <Feed
          testID="homeFeed"
          key="default"
          feed={feed}
          scrollElRef={scrollElRef}
          style={s.hContentRegion}
          showPostFollowBtn
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          renderEmptyState={renderEmptyState}
        />
        {feed.hasNewLatest && !feed.isRefreshing && (
          <LoadLatestBtn onPress={onPressLoadLatest} />
        )}
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        />
      </View>
    )
  },
)

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    paddingTop: 0,
    paddingBottom: 30,
  },
  tabBarAvi: {
    marginRight: 4,
  },
})
