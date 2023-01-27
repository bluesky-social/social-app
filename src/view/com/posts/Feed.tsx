import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  View,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {FeedModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'
import {ComposerPrompt} from './ComposerPrompt'
import {OnScrollCb} from '../../lib/hooks/useOnMainScroll'
import {s} from '../../lib/styles'

const COMPOSE_PROMPT_ITEM = {_reactKey: '__prompt__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressCompose,
  onPressTryAgain,
  onScroll,
  testID,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressCompose: (imagesOpen?: boolean) => void
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  testID?: string
}) {
  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: any}) => {
    if (item === COMPOSE_PROMPT_ITEM) {
      return <ComposerPrompt onPressCompose={onPressCompose} />
    } else if (item === EMPTY_FEED_ITEM) {
      return (
        <EmptyState
          icon="bars"
          message="This feed is empty!"
          style={styles.emptyState}
        />
      )
    } else {
      return <FeedItem item={item} />
    }
  }
  const onRefresh = () => {
    feed
      .refresh()
      .catch(err =>
        feed.rootStore.log.error('Failed to refresh posts feed', err),
      )
  }
  const onEndReached = () => {
    feed
      .loadMore()
      .catch(err => feed.rootStore.log.error('Failed to load more posts', err))
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
      <View style={styles.feedFooter}>
        <ActivityIndicator />
      </View>
    ) : (
      <View />
    )
  return (
    <View testID={testID} style={style}>
      <CenteredView>
        {!data && <ComposerPrompt onPressCompose={onPressCompose} />}
        {feed.isLoading && !data && <PostFeedLoadingPlaceholder />}
        {feed.hasError && (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
        )}
      </CenteredView>
      {feed.hasLoaded && data && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={feed.isRefreshing}
          contentContainerStyle={s.contentContainer}
          onScroll={onScroll}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
