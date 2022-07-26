import React, {useState, useEffect} from 'react'
import {View, StyleSheet} from 'react-native'
import {Shell} from '../../shell'
import type {RootTabsScreenProps} from '../../routes/types'
import {FeedViewModel} from '../../../state/models/feed-view'
import {useStores} from '../../../state'
import {ProfileHeader} from '../../com/profile/ProfileHeader'
import {Feed} from '../../com/feed/Feed'

export const Profile = ({
  navigation,
  route,
}: RootTabsScreenProps<'Profile'>) => {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<string>('')
  const [feedView, setFeedView] = useState<FeedViewModel | undefined>()

  useEffect(() => {
    const author = route.params.name
    if (feedView?.params.author === author) {
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching profile feed', author)
    const newFeedView = new FeedViewModel(store, {author})
    setFeedView(newFeedView)
    newFeedView
      .setup()
      .catch(err => console.error('Failed to fetch feed', err))
      .then(() => setHasSetup(author))
  }, [route.params.name, feedView?.params.author, store])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      if (hasSetup === feedView?.params.author) {
        console.log('Updating profile feed', hasSetup)
        feedView?.update()
      }
    })
  }, [navigation, feedView, hasSetup])

  const onNavigateContent = (screen: string, props: Record<string, string>) => {
    // @ts-ignore it's up to the callers to supply correct params -prf
    navigation.push(screen, props)
  }

  return (
    <Shell>
      <View style={styles.container}>
        <ProfileHeader
          user={route.params.name}
          onNavigateContent={onNavigateContent}
        />
        <View style={styles.feed}>
          {feedView && (
            <Feed feed={feedView} onNavigateContent={onNavigateContent} />
          )}
        </View>
      </View>
    </Shell>
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
