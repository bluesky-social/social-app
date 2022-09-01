import React, {useState, useEffect} from 'react'
import {View, StyleSheet} from 'react-native'
import {FeedViewModel} from '../../state/models/feed-view'
import {useStores} from '../../state'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {Feed} from '../com/feed/Feed'
import {ScreenParams} from '../routes'

export const Profile = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [feedView, setFeedView] = useState<FeedViewModel | undefined>()

  useEffect(() => {
    if (!visible) {
      return
    }
    const author = params.name
    if (hasSetup) {
      console.log('Updating profile feed for', author)
      feedView?.update()
    } else {
      console.log('Fetching profile feed for', author)
      const newFeedView = new FeedViewModel(store, {author})
      setFeedView(newFeedView)
      newFeedView
        .setup()
        .catch(err => console.error('Failed to fetch feed', err))
        .then(() => {
          setHasSetup(true)
          store.nav.setTitle(author)
        })
    }
  }, [visible, params.name, store])

  return (
    <View style={styles.container}>
      <ProfileHeader user={params.name} />
      <View style={styles.feed}>{feedView && <Feed feed={feedView} />}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  feed: {
    flex: 1,
  },
})
