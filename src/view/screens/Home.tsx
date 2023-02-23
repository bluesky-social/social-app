import React, {useEffect} from 'react'
import {FlatList, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {FAB} from '../com/util/FAB'
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {useStores} from 'state/index'
import {ScreenParams} from '../routes'
import {s} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'

const HEADER_HEIGHT = 42

export const Home = observer(function Home({navIdx, visible}: ScreenParams) {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const {screen, track} = useAnalytics()
  const scrollElRef = React.useRef<FlatList>(null)
  const [wasVisible, setWasVisible] = React.useState<boolean>(false)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })

  const doPoll = React.useCallback(
    (knownActive = false) => {
      if ((!knownActive && appState !== 'active') || !visible) {
        return
      }
      if (store.me.mainFeed.isLoading) {
        return
      }
      store.log.debug('HomeScreen: Polling for new posts')
      store.me.mainFeed.checkForLatest()
    },
    [appState, visible, store],
  )

  const scrollToTop = React.useCallback(() => {
    // NOTE: the feed is offset by the height of the collapsing header,
    //       so we scroll to the negative of that height -prf
    scrollElRef.current?.scrollToOffset({offset: -HEADER_HEIGHT})
  }, [scrollElRef])

  useEffect(() => {
    const softResetSub = store.onScreenSoftReset(scrollToTop)
    const feedCleanup = store.me.mainFeed.registerListeners()
    const pollInterval = setInterval(doPoll, 15e3)
    const cleanup = () => {
      clearInterval(pollInterval)
      softResetSub.remove()
      feedCleanup()
    }

    // guard to only continue when transitioning from !visible -> visible
    // TODO is this 100% needed? depends on if useEffect() is getting refired
    //      for reasons other than `visible` changing -prf
    if (!visible) {
      setWasVisible(false)
      return cleanup
    } else if (wasVisible) {
      return cleanup
    }
    setWasVisible(true)

    // just became visible
    screen('Feed')
    store.nav.setTitle(navIdx, 'Home')
    store.log.debug('HomeScreen: Updating feed')
    if (store.me.mainFeed.hasContent) {
      store.me.mainFeed.update()
    } else {
      store.me.mainFeed.setup()
    }
    return cleanup
  }, [visible, store, store.me.mainFeed, navIdx, doPoll, wasVisible, scrollToTop, screen])

  const onPressCompose = (imagesOpen?: boolean) => {
    track('Home:ComposeButtonPressed')
    store.shell.openComposer({imagesOpen})
  }
  const onPressTryAgain = () => {
    store.me.mainFeed.refresh()
  }
  const onPressLoadLatest = () => {
    store.me.mainFeed.refresh()
    scrollToTop()
  }

  return (
    <View style={s.h100pct}>
      <Feed
        testID="homeFeed"
        key="default"
        feed={store.me.mainFeed}
        scrollElRef={scrollElRef}
        style={s.h100pct}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
        headerOffset={HEADER_HEIGHT}
      />
      <ViewHeader title="Bluesky" canGoBack={false} hideOnScroll />
      {store.me.mainFeed.hasNewLatest && !store.me.mainFeed.isRefreshing && (
        <LoadLatestBtn onPress={onPressLoadLatest} />
      )}
      <FAB
        testID="composeFAB"
        icon="plus"
        onPress={() => onPressCompose(false)}
      />
    </View>
  )
})
