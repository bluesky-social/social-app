import React, {useState, useEffect} from 'react'
import {View} from 'react-native'
import {Feed} from '../com/feed/Feed'
import {FAB} from '../com/util/FloatingActionButton'
import {useStores} from '../../state'
import {FeedViewModel} from '../../state/models/feed-view'
import {ScreenParams} from '../routes'

export function Home({visible}: ScreenParams) {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [feedView, setFeedView] = useState<FeedViewModel | undefined>()
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
      const newFeedView = new FeedViewModel(store, {})
      setFeedView(newFeedView)
      newFeedView.setup().then(() => setHasSetup(true))
    }
  }, [visible, store])

  const onComposePress = () => {
    store.nav.navigate('/compose')
  }

  return (
    <View>
      {feedView && <Feed feed={feedView} />}
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
}
