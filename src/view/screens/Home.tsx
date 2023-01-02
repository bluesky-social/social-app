import React, {useState, useEffect} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {Text} from '../com/util/text/Text'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s, colors} from '../lib/styles'
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
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })

  const doPoll = (knownActive = false) => {
    if ((!knownActive && appState !== 'active') || !visible) {
      return
    }
    if (store.me.mainFeed.isLoading) {
      return
    }
    store.log.debug('Polling home feed')
    store.me.mainFeed.checkForLatest().catch(e => {
      store.log.error('Failed to poll feed', e.toString())
    })
  }

  useEffect(() => {
    let aborted = false
    const pollInterval = setInterval(() => doPoll(), 15e3)
    if (!visible) {
      return
    }

    if (hasSetup) {
      store.log.debug('Updating home feed')
      store.me.mainFeed.update()
      doPoll()
    } else {
      store.nav.setTitle(navIdx, 'Home')
      store.log.debug('Fetching home feed')
      store.me.mainFeed.setup().then(() => {
        if (aborted) return
        setHasSetup(true)
      })
    }
    return () => {
      clearInterval(pollInterval)
      aborted = true
    }
  }, [visible, store])

  const onPressCompose = () => {
    store.shell.openComposer({})
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
              ? {bottom: 50}
              : {bottom: 60 + clamp(safeAreaInsets.bottom, 15, 30)},
          ]}
          onPress={onPressLoadLatest}
          hitSlop={HITSLOP}>
          <FontAwesomeIcon icon="arrow-up" style={{color: colors.white}} />
          <Text style={styles.loadLatestText}>Load new posts</Text>
        </TouchableOpacity>
      ) : undefined}
    </View>
  )
})

const styles = StyleSheet.create({
  loadLatest: {
    flexDirection: 'row',
    position: 'absolute',
    left: 10,
    backgroundColor: colors.pink3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  loadLatestLow: {
    bottom: 15,
  },
  loadLatestText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
})
