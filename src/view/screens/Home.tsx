import React, {useEffect} from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {FAB} from '../com/util/FAB'
import {LoadLatestBtn} from '../com/util/LoadLatestBtn'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s} from '../lib/styles'
import {useOnMainScroll} from '../lib/hooks/useOnMainScroll'

export const Home = observer(function Home({
  navIdx,
  visible,
  scrollElRef,
}: ScreenParams) {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
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
      store.log.debug('Polling home feed')
      store.me.mainFeed.checkForLatest().catch(e => {
        store.log.error('Failed to poll feed', e)
      })
    },
    [appState, visible, store],
  )

  useEffect(() => {
    const feedCleanup = store.me.mainFeed.registerListeners()
    const pollInterval = setInterval(() => doPoll(), 15e3)
    const cleanup = () => {
      clearInterval(pollInterval)
      feedCleanup()
    }

    if (!visible) {
      setWasVisible(false)
      return cleanup
    } else if (wasVisible) {
      return cleanup
    }
    setWasVisible(true)

    store.nav.setTitle(navIdx, 'Home')
    store.log.debug('Updating home feed')
    if (store.me.mainFeed.hasContent) {
      store.me.mainFeed.update()
    } else {
      store.me.mainFeed.setup()
    }
    return cleanup
  }, [visible, store, navIdx, doPoll, wasVisible])

  const onPressCompose = (imagesOpen?: boolean) => {
    store.shell.openComposer({imagesOpen})
  }
  const onPressTryAgain = () => {
    store.me.mainFeed.refresh()
  }
  const onPressLoadLatest = () => {
    store.me.mainFeed.refresh()
    scrollElRef?.current?.scrollToOffset({offset: 0})
  }

  return (
    <View style={s.h100pct}>
      <ViewHeader title="Bluesky" subtitle="Private Beta" canGoBack={false} />
      <Feed
        testID="homeFeed"
        key="default"
        feed={store.me.mainFeed}
        scrollElRef={scrollElRef}
        style={s.h100pct}
        onPressCompose={onPressCompose}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
      />
      {store.me.mainFeed.hasNewLatest && !store.me.mainFeed.isRefreshing && (
        <LoadLatestBtn onPress={onPressLoadLatest} />
      )}
      <FAB icon="pen-nib" onPress={() => onPressCompose(false)} />
    </View>
  )
})
