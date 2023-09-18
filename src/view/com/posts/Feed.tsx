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
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {s} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {isWeb} from 'platform/detection'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  scrollEventThrottle,
  renderEmptyState,
  testID,
  headerOffset = 0,
  ListHeaderComponent,
  extraData,
}: {
  feed: PostsFeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  scrollEventThrottle?: number
  renderEmptyState?: () => JSX.Element
  testID?: string
  headerOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const listWrapperRef = React.useRef<View>(null)

  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (feed.hasLoaded) {
      if (feed.hasError) {
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
    if (!feed.hasLoaded) return

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
      if (item === EMPTY_FEED_ITEM) {
        if (renderEmptyState) {
          return renderEmptyState()
        }
        return <View />
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={feed.error}
            onPressTryAgain={onPressTryAgain}
          />
        )
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
    [feed, onPressTryAgain, onPressRetryLoadMore, renderEmptyState],
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

  // This is the handler for the middle mouse button click on the feed.
  // Normally, we would do this via `onAuxClick` handler on each link element
  // However, that handler is not supported on react-native-web and there are some
  // discrepancies between various browsers (i.e: safari doesn't trigger it and routes through click event)
  // So, this temporary alternative is meant to bridge the gap in an efficient way until the support improves.
  React.useEffect(() => {
    if (listWrapperRef?.current && isWeb) {
      const wrapperEl = listWrapperRef.current
      const handleAuxClick = (e: MouseEvent & {target: HTMLElement}) => {
        // Only handle the middle mouse button click, early exit otherwise
        if (e.button !== 1) return

        // Each feed item is wrapped by a div with a data-href attribute
        // The value of the attr contains the link to the post
        // Maybe this needs a better selector? in case there are nested items with links?
        const parentWithPostLink = e.target.closest?.('div[data-href]')

        // Only try to process the click if we found a parent with the data-href attr and there is a value for it
        console.log(parentWithPostLink)
        if (parentWithPostLink) {
          const href = parentWithPostLink.getAttribute('data-href')
          console.log(parentWithPostLink, href)
          if (href) window.open(href, '_blank')
        }
      }

      // @ts-ignore For web only
      wrapperEl.addEventListener('auxclick', handleAuxClick)

      return () => {
        // @ts-ignore For web only
        wrapperEl?.removeEventListener('auxclick', handleAuxClick)
      }
    }
  }, [])

  return (
    <View testID={testID} style={style} ref={listWrapperRef}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={!feed.hasLoaded ? [LOADING_ITEM] : data}
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
        onEndReachedThreshold={0.6}
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        extraData={extraData}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
      />
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})
