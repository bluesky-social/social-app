import React, {useState, useEffect} from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Feed} from '../com/posts/Feed'
import {FAB} from '../com/util/FloatingActionButton'
import {useStores} from '../../state'
import {FeedModel} from '../../state/models/feed-view'
import {ComposePostModel} from '../../state/models/shell'
import {ScreenParams} from '../routes'
import {s} from '../lib/styles'

export const Home = observer(function Home({visible}: ScreenParams) {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [feedView, setFeedView] = useState<FeedModel | undefined>()
  const store = useStores()

  useEffect(() => {
    if (!visible) {
      return
    }
    if (hasSetup) {
      console.log('Updating home feed')
      feedView?.update()
    } else {
      store.nav.setTitle('Home')
      console.log('Fetching home feed')
      const newFeedView = new FeedModel(store, 'home', {})
      setFeedView(newFeedView)
      newFeedView.setup().then(() => setHasSetup(true))
    }
  }, [visible, store])

  const onComposePress = () => {
    store.shell.openModal(new ComposePostModel({onPost: onCreatePost}))
  }
  const onCreatePost = () => {
    feedView?.loadLatest()
  }

  return (
    <View style={s.flex1}>
      {feedView && <Feed feed={feedView} />}
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
})
