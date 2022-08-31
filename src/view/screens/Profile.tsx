import React, {useState, useEffect} from 'react'
import {View, StyleSheet} from 'react-native'
import {FeedViewModel} from '../../state/models/feed-view'
import {useStores} from '../../state'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {Feed} from '../com/feed/Feed'
import {ScreenParams} from '../routes'
import {useLoadEffect} from '../lib/navigation'

export const Profile = ({params}: ScreenParams) => {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<string>('')
  const [feedView, setFeedView] = useState<FeedViewModel | undefined>()

  useLoadEffect(() => {
    const author = params.name
    if (feedView?.params.author === author) {
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching profile feed', author)
    const newFeedView = new FeedViewModel(store, {author})
    setFeedView(newFeedView)
    newFeedView
      .setup()
      .catch(err => console.error('Failed to fetch feed', err))
      .then(() => {
        setHasSetup(author)
        store.nav.setTitle(author)
      })
  }, [params.name, feedView?.params.author, store])

  // TODO
  // useEffect(() => {
  //   return navigation.addListener('focus', () => {
  //     if (hasSetup === feedView?.params.author) {
  //       console.log('Updating profile feed', hasSetup)
  //       feedView?.update()
  //     }
  //   })
  // }, [navigation, feedView, hasSetup])

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
