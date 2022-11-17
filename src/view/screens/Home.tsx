import React, {useState, useEffect, useMemo} from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import useAppState from 'react-native-appstate-hook'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/posts/Feed'
import {FAB} from '../com/util/FloatingActionButton'
import {useStores} from '../../state'
import {FeedModel} from '../../state/models/feed-view'
import {ScreenParams} from '../routes'
import {s, colors} from '../lib/styles'

export const Home = observer(function Home({
  visible,
  scrollElRef,
}: ScreenParams) {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })
  const defaultFeedView = useMemo<FeedModel>(
    () =>
      new FeedModel(store, 'home', {
        algorithm: 'reverse-chronological',
      }),
    [store],
  )

  const doPoll = (knownActive = false) => {
    if ((!knownActive && appState !== 'active') || !visible) {
      return
    }
    if (defaultFeedView.isLoading) {
      return
    }
    console.log('Polling home feed')
    defaultFeedView.checkForLatest().catch(e => {
      console.error('Failed to poll feed', e)
    })
  }

  useEffect(() => {
    let aborted = false
    const pollInterval = setInterval(() => doPoll(), 15e3)
    if (!visible) {
      return
    }
    if (hasSetup) {
      console.log('Updating home feed')
      defaultFeedView.update()
    } else {
      store.nav.setTitle('Home')
      console.log('Fetching home feed')
      defaultFeedView.setup().then(() => {
        if (aborted) return
        setHasSetup(true)
      })
    }
    return () => {
      clearInterval(pollInterval)
      aborted = true
    }
  }, [visible, store])

  const onComposePress = () => {
    store.shell.openComposer({onPost: onCreatePost})
  }
  const onCreatePost = () => {
    defaultFeedView.loadLatest()
  }
  const onPressTryAgain = () => {
    defaultFeedView.refresh()
  }
  const onPressLoadLatest = () => {
    defaultFeedView.refresh()
    scrollElRef?.current?.scrollToOffset({offset: 0})
  }

  return (
    <View style={s.flex1}>
      <ViewHeader title="Bluesky" subtitle="Private Beta" />
      <Feed
        key="default"
        feed={defaultFeedView}
        scrollElRef={scrollElRef}
        style={{flex: 1}}
        onPressTryAgain={onPressTryAgain}
      />
      {defaultFeedView.hasNewLatest ? (
        <TouchableOpacity style={styles.loadLatest} onPress={onPressLoadLatest}>
          <FontAwesomeIcon icon="arrow-up" style={{color: colors.white}} />
          <Text style={styles.loadLatestText}>Load new posts</Text>
        </TouchableOpacity>
      ) : undefined}
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
})

const styles = StyleSheet.create({
  loadLatest: {
    flexDirection: 'row',
    position: 'absolute',
    left: 10,
    bottom: 15,
    backgroundColor: colors.pink3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  loadLatestText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
  },
})
