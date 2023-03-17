import React from 'react'
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
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
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {WelcomeBanner} from '../com/util/WelcomeBanner'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {TabBar} from 'view/com/util/TabBar'
import {Pager, PageSelectedEvent, TabBarProps} from 'view/com/util/Pager'
import {FAB} from '../com/util/FAB'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'

const TAB_BAR_HEIGHT = 82

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired((_opts: Props) => {
  const store = useStores()
  const pal = usePalette('default')
  const [selectedPage, setSelectedPage] = React.useState(0)

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

  const onPressAvi = React.useCallback(() => {
    store.shell.openDrawer()
  }, [store])

  const renderTabBar = React.useCallback(
    (props: TabBarProps) => {
      return (
        <View style={[pal.view, pal.border, styles.tabBar]}>
          <TouchableOpacity style={styles.tabBarAvi} onPress={onPressAvi}>
            <UserAvatar avatar={store.me.avatar} size={32} />
          </TouchableOpacity>
          <TabBar items={['Suggested', 'Following']} {...props} />
        </View>
      )
    },
    [store.me.avatar, pal, onPressAvi],
  )

  return (
    <Pager onPageSelected={onPageSelected} renderTabBar={renderTabBar}>
      <AlgoView key="1" />
      <View key="2">
        <FollowingView />
      </View>
    </Pager>
  )
})

const AlgoView = observer(() => {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const {screen, track} = useAnalytics()
  const scrollElRef = React.useRef<FlatList>(null)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })
  const isFocused = useIsFocused()
  const winDim = useWindowDimensions()
  const containerStyle = React.useMemo(
    () => ({height: winDim.height - TAB_BAR_HEIGHT}),
    [winDim],
  )
  const algoFeed = React.useMemo(() => {
    const feed = new FeedModel(store, 'goodstuff', {})
    feed.setup()
    return feed
  }, [store])

  const doPoll = React.useCallback(
    (knownActive = false) => {
      if ((!knownActive && appState !== 'active') || !isFocused) {
        return
      }
      if (algoFeed.isLoading) {
        return
      }
      store.log.debug('HomeScreen: Polling for new posts')
      algoFeed.checkForLatest()
    },
    [appState, isFocused, store, algoFeed],
  )

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0})
  }, [scrollElRef])

  useFocusEffect(
    React.useCallback(() => {
      const softResetSub = store.onScreenSoftReset(scrollToTop)
      const feedCleanup = algoFeed.registerListeners()
      const pollInterval = setInterval(doPoll, 15e3)

      screen('Feed')
      store.log.debug('HomeScreen: Updating feed')
      if (algoFeed.hasContent) {
        algoFeed.update()
      }

      return () => {
        clearInterval(pollInterval)
        softResetSub.remove()
        feedCleanup()
      }
    }, [store, doPoll, scrollToTop, screen, algoFeed]),
  )

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    store.shell.openComposer({})
  }, [store, track])

  const onPressTryAgain = React.useCallback(() => {
    algoFeed.refresh()
  }, [algoFeed])

  const onPressLoadLatest = React.useCallback(() => {
    algoFeed.refresh()
    scrollToTop()
  }, [algoFeed, scrollToTop])

  return (
    <View style={containerStyle}>
      {store.shell.isOnboarding && <WelcomeBanner />}
      <Feed
        testID="homeFeed"
        key="default"
        feed={algoFeed}
        scrollElRef={scrollElRef}
        style={s.hContentRegion}
        showPostFollowBtn
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
      />
      {algoFeed.hasNewLatest && !algoFeed.isRefreshing && (
        <LoadLatestBtn onPress={onPressLoadLatest} />
      )}
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
      />
    </View>
  )
})

const FollowingView = observer(() => {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const {screen, track} = useAnalytics()
  const scrollElRef = React.useRef<FlatList>(null)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })
  const isFocused = useIsFocused()
  const winDim = useWindowDimensions()
  const containerStyle = React.useMemo(
    () => ({height: winDim.height - TAB_BAR_HEIGHT}),
    [winDim],
  )

  const doPoll = React.useCallback(
    (knownActive = false) => {
      if ((!knownActive && appState !== 'active') || !isFocused) {
        return
      }
      if (store.me.mainFeed.isLoading) {
        return
      }
      store.log.debug('HomeScreen: Polling for new posts')
      store.me.mainFeed.checkForLatest()
    },
    [appState, isFocused, store],
  )

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0})
  }, [scrollElRef])

  useFocusEffect(
    React.useCallback(() => {
      const softResetSub = store.onScreenSoftReset(scrollToTop)
      const feedCleanup = store.me.mainFeed.registerListeners()
      const pollInterval = setInterval(doPoll, 15e3)

      screen('Feed')
      store.log.debug('HomeScreen: Updating feed')
      if (store.me.mainFeed.hasContent) {
        store.me.mainFeed.update()
      }

      return () => {
        clearInterval(pollInterval)
        softResetSub.remove()
        feedCleanup()
      }
    }, [store, doPoll, scrollToTop, screen]),
  )

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    store.shell.openComposer({})
  }, [store, track])

  const onPressTryAgain = React.useCallback(() => {
    store.me.mainFeed.refresh()
  }, [store])

  const onPressLoadLatest = React.useCallback(() => {
    store.me.mainFeed.refresh()
    scrollToTop()
  }, [store, scrollToTop])

  return (
    <View style={containerStyle}>
      {store.shell.isOnboarding && <WelcomeBanner />}
      <Feed
        testID="homeFeed"
        key="default"
        feed={store.me.mainFeed}
        scrollElRef={scrollElRef}
        style={s.hContentRegion}
        showPostFollowBtn
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
      />
      {store.me.mainFeed.hasNewLatest && !store.me.mainFeed.isRefreshing && (
        <LoadLatestBtn onPress={onPressLoadLatest} />
      )}
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  tabBarAvi: {
    marginRight: 16,
    paddingBottom: 2,
  },
})
