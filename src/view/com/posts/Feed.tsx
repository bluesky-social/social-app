import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  View,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {CenteredView, FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Button} from '../util/forms/Button'
import {FeedModel} from 'state/models/feed-view'
import {FeedItem} from './FeedItem'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {MagnifyingGlassIcon} from 'lib/icons'
import {NavigationProp} from 'lib/routes/types'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_FEED_ITEM = {_reactKey: '__error__'}

export const Feed = observer(function Feed({
  feed,
  style,
  showPostFollowBtn,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  testID,
  headerOffset = 0,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  showPostFollowBtn?: boolean
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  testID?: string
  headerOffset?: number
}) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()

  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (feed.hasLoaded) {
      if (feed.hasError) {
        feedItems = feedItems.concat([ERROR_FEED_ITEM])
      }
      if (feed.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM])
      } else {
        feedItems = feedItems.concat(feed.nonReplyFeed)
      }
    }
    return feedItems
  }, [feed.hasError, feed.hasLoaded, feed.isEmpty, feed.nonReplyFeed])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Feed:onRefresh')
    setIsRefreshing(true)
    try {
      await feed.refresh()
    } catch (err) {
      feed.rootStore.log.error('Failed to refresh posts feed', err)
    }
    setIsRefreshing(false)
  }, [feed, track, setIsRefreshing])
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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MagnifyingGlassIcon
                style={[styles.emptyIcon, pal.text]}
                size={62}
              />
            </View>
            <Text type="xl-medium" style={[s.textCenter, pal.text]}>
              Your feed is empty! You should follow some accounts to fix this.
            </Text>
            <Button
              type="inverted"
              style={styles.emptyBtn}
              onPress={
                () =>
                  navigation.navigate(
                    'SearchTab',
                  ) /* TODO make sure it goes to root of the tab */
              }>
              <Text type="lg-medium" style={palInverted.text}>
                Find accounts
              </Text>
              <FontAwesomeIcon
                icon="angle-right"
                style={palInverted.text as FontAwesomeIconStyle}
                size={14}
              />
            </Button>
          </View>
        )
      } else if (item === ERROR_FEED_ITEM) {
        return (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
        )
      }
      return <FeedItem item={item} showFollowBtn={showPostFollowBtn} />
    },
    [feed, onPressTryAgain, showPostFollowBtn, pal, palInverted, navigation],
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
          onEndReachedThreshold={0.6}
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
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
