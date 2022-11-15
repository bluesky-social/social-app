import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {Text, View, FlatList, StyleProp, ViewStyle} from 'react-native'
import {ErrorMessage} from '../util/ErrorMessage'
import {FeedModel, FeedItemModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressTryAgain,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
}) {
  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: FeedItemModel}) => <FeedItem item={item} />
  const onRefresh = () => {
    feed.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    feed.loadMore().catch(err => console.error('Failed to load more', err))
  }
  return (
    <View style={style}>
      {feed.isLoading && !feed.isRefreshing && !feed.hasContent && (
        <Text>Loading...</Text>
      )}
      {feed.hasError && (
        <ErrorMessage
          dark
          message={feed.error}
          style={{margin: 6}}
          onPressTryAgain={onPressTryAgain}
        />
      )}
      {feed.hasContent && (
        <FlatList
          ref={scrollElRef}
          data={feed.feed.slice()}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={feed.isRefreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
      {feed.isEmpty && !feed.hasError && (
        <View>
          <Text>This feed is empty!</Text>
        </View>
      )}
    </View>
  )
})
