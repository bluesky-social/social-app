import React, {MutableRefObject} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AtUri, AppBskyFeedGetFeed} from '@atproto/api'

import {toShareUrl} from 'lib/strings/url-helpers'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {PostsFeedModel, PostsFeedModelError} from 'state/models/feeds/posts'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from '../util/Link'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {Button} from 'view/com/util/forms/Button'
import {CustomFeedContextMenu} from 'view/com/feeds/CustomFeedContextMenu'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}
const FEED_INNER_HEADER = {_reactKey: '__feedInnerHeader__'}
const FEED_INNER_HEADER_LOADING = {_reactKey: '__feedInnerHeaderLoading__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  scrollEventThrottle,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  ListHeaderComponent,
  extraData,
  showFeedHeaderContextMenu,
}: {
  feed: PostsFeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  scrollEventThrottle?: number
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  testID?: string
  headerOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
  showFeedHeaderContextMenu?: boolean
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const params = feed.params as AppBskyFeedGetFeed.QueryParams
  const isCustomFeed = Boolean(params.feed)

  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (feed.hasLoaded) {
      if (isCustomFeed) {
        feedItems.push(FEED_INNER_HEADER)
      }
      if (feed.hasError && !isCustomFeed) {
        // applies to our internal algo feeds only
        feedItems = feedItems.concat([ERROR_ITEM])
      }
      if (feed.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM])
      } else {
        feedItems = feedItems.concat(feed.slices)
      }
      if (feed.loadMoreError) {
        feedItems = feedItems.concat([LOAD_MORE_ERROR_ITEM])
      }
    }
    return feedItems
  }, [
    feed.hasError,
    feed.hasLoaded,
    feed.isEmpty,
    feed.slices,
    feed.loadMoreError,
    isCustomFeed,
  ])

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
    if (!feed.hasLoaded || !feed.hasMore) return

    track('Feed:onEndReached')
    try {
      await feed.loadMore()
    } catch (err) {
      feed.rootStore.log.error('Failed to load more posts', err)
    }
  }, [feed, track])

  const onPressRetryLoadMore = React.useCallback(() => {
    feed.retryLoadMore()
  }, [feed])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === FEED_INNER_HEADER_LOADING) {
        return <FeedHeaderLoading />
      } else if (item === FEED_INNER_HEADER) {
        return (
          <FeedInnerHeader
            showContextMenu={showFeedHeaderContextMenu}
            error={feed.cleanError}
            params={params}
          />
        )
      } else if (item === EMPTY_FEED_ITEM) {
        return renderEmptyState()
      } else if (item === ERROR_ITEM) {
        return <ErrorMessage feed={feed} onPress={onPressTryAgain} />
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching posts. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <PostFeedLoadingPlaceholder />
      }
      return <FeedSlice slice={item} />
    },
    [
      feed,
      params,
      showFeedHeaderContextMenu,
      onPressTryAgain,
      onPressRetryLoadMore,
      renderEmptyState,
    ],
  )

  const FeedFooter = React.useCallback(
    () =>
      feed.isLoadingMore ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : !feed.hasMore && !feed.isEmpty && renderEndOfFeed ? (
        renderEndOfFeed()
      ) : (
        <View />
      ),
    [feed.isLoadingMore, feed.hasMore, feed.isEmpty, renderEndOfFeed],
  )

  return (
    <View testID={testID} style={style}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={
          !feed.hasLoaded
            ? isCustomFeed
              ? [FEED_INNER_HEADER_LOADING, LOADING_ITEM]
              : [LOADING_ITEM]
            : data
        }
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListFooterComponent={FeedFooter}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
            progressViewOffset={headerOffset}
          />
        }
        contentContainerStyle={s.contentContainer}
        style={{paddingTop: headerOffset}}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        extraData={extraData}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
      />
    </View>
  )
})

function ErrorMessage({
  feed,
  onPress,
}: {
  feed: PostsFeedModel
  onPress?: () => void
}) {
  const pal = usePalette('default')
  return (
    <View
      style={[
        pal.viewLight,
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: 18,
          paddingVertical: 12,
        },
      ]}>
      <Text style={{paddingRight: 18}}>
        {feed.cleanError?.message || feed.error}
      </Text>
      <Button type="default-light" onPress={onPress}>
        Try again
      </Button>
    </View>
  )
}

function FeedHeaderLoading() {
  const pal = usePalette('default')
  return (
    <View
      style={[
        pal.viewLight,
        {
          width: '100%',
          paddingHorizontal: 18,
          paddingVertical: 18,
        },
      ]}
    />
  )
}

function FeedInnerHeader({
  error,
  params,
  showContextMenu = true,
}: {
  error?: PostsFeedModelError
  params: AppBskyFeedGetFeed.QueryParams
  showContextMenu?: boolean
}) {
  const pal = usePalette('default')
  const {host, rkey} = new AtUri(params.feed)
  const uri = makeRecordUri(host, 'app.bsky.feed.generator', rkey)
  const feed = useCustomFeed(uri)
  const author = feed?.data?.creator?.handle
  const {isDesktop} = useWebMediaQueries()
  const shareUrl = toShareUrl(`/profile/${host}`)

  return (
    <View
      style={[
        pal.viewLight,
        {
          width: '100%',
          paddingHorizontal: 18,
        },
      ]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 8,
        }}>
        <Text>
          <Text style={[pal.textLight]}>By&nbsp;</Text>
          {author ? (
            <TextLink href={shareUrl} text={'@' + author} />
          ) : (
            <Text style={[pal.textLight]}>...</Text>
          )}
        </Text>

        {author && showContextMenu && !isDesktop ? (
          <CustomFeedContextMenu feed={feed}>
            <View
              style={{
                height: 24,
                width: 24,
                paddingTop: 1,
                borderRadius: 24,
                backgroundColor: pal.view.backgroundColor,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesomeIcon
                icon="ellipsis"
                size={18}
                color={pal.colors.textLight}
              />
            </View>
          </CustomFeedContextMenu>
        ) : (
          <View style={{height: 24}} />
        )}
      </View>

      {error?.message && (
        <>
          <View style={[pal.view, {height: 1}]} />

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              paddingVertical: 12,
            }}>
            <Text style={{width: '100%'}}>{error.message}</Text>

            {error.type === 'upstream' ? (
              <Button type="default-light" style={{marginTop: 12}}>
                Remove from my feeds
              </Button>
            ) : null}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
