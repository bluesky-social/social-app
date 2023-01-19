import React, {useEffect} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import LinearGradient from 'react-native-linear-gradient'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {Text} from '../com/util/text/Text'
import {FAB} from '../com/util/FAB'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s, colors, gradients} from '../lib/styles'
import {useOnMainScroll} from '../lib/hooks/useOnMainScroll'
import {clamp} from 'lodash'

const HITSLOP = {left: 20, top: 20, right: 20, bottom: 20}

export const Home = observer(function Home({
  navIdx,
  visible,
  scrollElRef,
}: ScreenParams) {
  const store = useStores()
  const onMainScroll = useOnMainScroll(store)
  const safeAreaInsets = useSafeAreaInsets()
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
    <View style={s.flex1}>
      <ViewHeader title="Bluesky" subtitle="Private Beta" canGoBack={false} />
      <Feed
        testID="homeFeed"
        key="default"
        feed={store.me.mainFeed}
        scrollElRef={scrollElRef}
        style={{flex: 1}}
        onPressCompose={onPressCompose}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
      />
      {store.me.mainFeed.hasNewLatest && !store.me.mainFeed.isRefreshing ? (
        <TouchableOpacity
          style={[
            styles.loadLatest,
            store.shell.minimalShellMode
              ? {bottom: 35}
              : {bottom: 60 + clamp(safeAreaInsets.bottom, 15, 30)},
          ]}
          onPress={onPressLoadLatest}
          hitSlop={HITSLOP}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.loadLatestInner}>
            <Text type="md-bold" style={styles.loadLatestText}>
              Load new posts
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : undefined}
      <FAB icon="pen-nib" onPress={() => onPressCompose(false)} />
    </View>
  )
})

const styles = StyleSheet.create({
  loadLatest: {
    position: 'absolute',
    left: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  loadLatestInner: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
  },
  loadLatestText: {
    color: colors.white,
  },
})
