import React from 'react'
import {observer} from 'mobx-react-lite'
import {Text, View} from 'react-native'
import {FeedViewModel} from '../../state/models/feed-view'
import {FeedItem} from './FeedItem'

export const Feed = observer(function Feed({feed}: {feed: FeedViewModel}) {
  return (
    <View>
      {feed.isLoading && <Text>Loading...</Text>}
      {feed.hasError && <Text>{feed.error}</Text>}
      {feed.hasContent &&
        feed.feed.map(item => <FeedItem key={item.key} item={item} />)}
      {feed.isEmpty && <Text>This feed is empty!</Text>}
    </View>
  )
})
