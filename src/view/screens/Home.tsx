import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {WelcomeBanner} from '../com/util/WelcomeBanner'
import {FAB} from '../com/util/FAB'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'

const HEADER_HEIGHT = 42

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = observer(function Home(_opts: Props) {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const {screen, track} = useAnalytics()
  const scrollElRef = React.useRef<FlatList>(null)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })
  const isFocused = useIsFocused()

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
    // NOTE: the feed is offset by the height of the collapsing header,
    //       so we scroll to the negative of that height -prf
    scrollElRef.current?.scrollToOffset({offset: -HEADER_HEIGHT})
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
    <View style={s.hContentRegion}>
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
        headerOffset={store.shell.isOnboarding ? 0 : HEADER_HEIGHT}
      />
      {!store.shell.isOnboarding && (
        <ViewHeader title="Bluesky" canGoBack={false} hideOnScroll />
      )}
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
