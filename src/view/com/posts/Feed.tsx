import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  View,
  FlatList,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/ErrorMessage'
import {FeedModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'
import {ComposePrompt} from '../composer/Prompt'
import {OnScrollCb} from '../../lib/useOnMainScroll'

const COMPOSE_PROMPT_ITEM = {_reactKey: '__prompt__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressCompose,
  onPressTryAgain,
  onScroll,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressCompose: () => void
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
}) {
  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: any}) => {
    if (item === COMPOSE_PROMPT_ITEM) {
      return <ComposePrompt onPressCompose={onPressCompose} />
    } else if (item === EMPTY_FEED_ITEM) {
      return (
        <EmptyState
          icon="bars"
          message="This feed is empty!"
          style={{paddingVertical: 40}}
        />
      )
    } else {
      return <FeedItem item={item} />
    }
  }
  const onRefresh = () => {
    feed.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    feed.loadMore().catch(err => console.error('Failed to load more', err))
  }
  let data
  if (feed.hasLoaded) {
    if (feed.isEmpty) {
      data = [COMPOSE_PROMPT_ITEM, EMPTY_FEED_ITEM]
    } else {
      data = [COMPOSE_PROMPT_ITEM].concat(feed.feed)
    }
  }
  const FeedFooter = () =>
    feed.isLoading ? (
      <View style={{paddingTop: 20}}>
        <ActivityIndicator />
      </View>
    ) : (
      <View />
    )
  return (
    <View style={style}>
      {!data && <ComposePrompt onPressCompose={onPressCompose} />}
      {feed.isLoading && !data && <PostFeedLoadingPlaceholder />}
      {feed.hasError && (
        <ErrorMessage
          dark
          message={feed.error}
          style={{margin: 6}}
          onPressTryAgain={onPressTryAgain}
        />
      )}
      {feed.hasLoaded && data && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={feed.isRefreshing}
          contentContainerStyle={{paddingBottom: 100}}
          onScroll={onScroll}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
    </View>
  )
})
