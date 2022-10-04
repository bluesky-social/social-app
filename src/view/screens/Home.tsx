import React, {useState, useEffect, useMemo} from 'react'
import {useSharedValue} from 'react-native-reanimated'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Feed} from '../com/posts/Feed'
import {FAB} from '../com/util/FloatingActionButton'
import {Selector} from '../com/util/Selector'
import {useStores} from '../../state'
import {FeedModel} from '../../state/models/feed-view'
import {ComposePostModel} from '../../state/models/shell'
import {ScreenParams} from '../routes'
import {s} from '../lib/styles'

export const Home = observer(function Home({visible}: ScreenParams) {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [selectedViewIndex, setSelectedViewIndex] = useState<number>(0)
  const defaultFeedView = useMemo<FeedModel>(
    () =>
      new FeedModel(store, 'home', {
        algorithm: 'reverse-chronological',
      }),
    [store],
  )
  const firehoseFeedView = useMemo<FeedModel>(
    () =>
      new FeedModel(store, 'home', {
        algorithm: 'firehose',
      }),
    [store],
  )
  const swipeGestureInterp = useSharedValue<number>(0)

  useEffect(() => {
    if (!visible) {
      return
    }
    if (hasSetup) {
      console.log('Updating home feed')
      defaultFeedView.update()
      firehoseFeedView.update()
    } else {
      store.nav.setTitle('Home')
      console.log('Fetching home feed')
      defaultFeedView.setup().then(() => setHasSetup(true))
      firehoseFeedView.setup()
    }
  }, [visible, store])

  const onComposePress = () => {
    store.shell.openModal(new ComposePostModel({onPost: onCreatePost}))
  }
  const onCreatePost = () => {
    defaultFeedView.loadLatest()
    firehoseFeedView.loadLatest()
  }
  const onSelectView = (viewIndex: number) => {
    setSelectedViewIndex(viewIndex)
  }

  return (
    <View style={s.flex1}>
      <Selector
        items={['My Feed', 'Firehose']}
        selectedIndex={selectedViewIndex}
        onSelect={onSelectView}
        swipeGestureInterp={swipeGestureInterp}
      />
      <Feed
        key="default"
        feed={defaultFeedView}
        style={{display: selectedViewIndex === 0 ? 'flex' : 'none'}}
      />
      <Feed
        key="firehose"
        feed={firehoseFeedView}
        style={{display: selectedViewIndex === 1 ? 'flex' : 'none'}}
      />
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
})
