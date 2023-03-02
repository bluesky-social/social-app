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
import {FeedModel} from 'state/models/feed-view'
import {FeedItem} from './FeedItem'
import {WelcomeBanner} from '../util/WelcomeBanner'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'
import {useStores} from 'state/index'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_FEED_ITEM = {_reactKey: '__error__'}
const WELCOME_FEED_ITEM = {_reactKey: '__welcome__'}

export const Feed = observer(function Feed({
  feed,
  style,
  showWelcomeBanner,
  showPostFollowBtn,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  testID,
  headerOffset = 0,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  showWelcomeBanner?: boolean
  showPostFollowBtn?: boolean
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  testID?: string
  headerOffset?: number
}) {
  const {track} = useAnalytics()
  const store = useStores()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isNewUser, setIsNewUser] = React.useState<boolean>(false)

  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (feed.hasLoaded) {
      if (feed.hasError) {
        feedItems = feedItems.concat([ERROR_FEED_ITEM])
      }
      if (showWelcomeBanner && isNewUser) {
        feedItems = feedItems.concat([WELCOME_FEED_ITEM])
      }
      if (feed.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM])
      } else {
        feedItems = feedItems.concat(feed.feed)
      }
    }
    return feedItems
  }, [
    feed.hasError,
    feed.hasLoaded,
    feed.isEmpty,
    feed.feed,
    showWelcomeBanner,
    isNewUser,
  ])

  // events
  // =

  const checkWelcome = React.useCallback(async () => {
    if (showWelcomeBanner) {
      await store.me.follows.fetchIfNeeded()
      setIsNewUser(store.me.follows.isEmpty)
    }
  }, [showWelcomeBanner, store.me.follows])
  React.useEffect(() => {
    checkWelcome()
  }, [checkWelcome])

  const onRefresh = React.useCallback(async () => {
    track('Feed:onRefresh')
    setIsRefreshing(true)
    checkWelcome()
    try {
      await feed.refresh()
    } catch (err) {
      feed.rootStore.log.error('Failed to refresh posts feed', err)
    }
    setIsRefreshing(false)
  }, [feed, track, setIsRefreshing, checkWelcome])
  const onEndReached = React.useCallback(async () => {
    track('Feed:onEndReached')
    try {
      await feed.loadMore()
    } catch (err) {
      feed.rootStore.log.error('Failed to load more posts', err)
    }
  }, [feed, track])

  // rendering
  // =

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        return (
          <EmptyState
            icon="bars"
            message="This feed is empty!"
            style={styles.emptyState}
          />
        )
      } else if (item === ERROR_FEED_ITEM) {
        return (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item === WELCOME_FEED_ITEM) {
        return <WelcomeBanner />
      }
      return <FeedItem item={item} showFollowBtn={showPostFollowBtn} />
    },
    [feed, onPressTryAgain, showPostFollowBtn],
  )

  const FeedFooter = React.useCallback(
    () =>
      feed.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [feed],
  )

  return (
    <View testID={testID} style={style}>
      {feed.isLoading && data.length === 0 && (
        <CenteredView style={{paddingTop: headerOffset}}>
          {showWelcomeBanner && isNewUser && <WelcomeBanner />}
          <PostFeedLoadingPlaceholder />
        </CenteredView>
      )}
      {data.length > 0 && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={isRefreshing}
          contentContainerStyle={s.contentContainer}
          onScroll={onScroll}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          removeClippedSubviews={true}
          contentInset={{top: headerOffset}}
          contentOffset={{x: 0, y: headerOffset * -1}}
          progressViewOffset={headerOffset}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})
