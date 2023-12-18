import React from 'react'
import {
  Dimensions,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'
import {List, ListRef} from '../util/List'
import {FeedSourceCardLoaded} from './FeedSourceCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useProfileFeedgensQuery, RQKEY} from '#/state/queries/profile-feedgens'
import {logger} from '#/logger'
import {Trans} from '@lingui/macro'
import {cleanError} from '#/lib/strings/errors'
import {useTheme} from '#/lib/ThemeContext'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {hydrateFeedGenerator} from '#/state/queries/feed'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {isNative} from '#/platform/detection'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

interface SectionRef {
  scrollToTop: () => void
}

interface ProfileFeedgensProps {
  did: string
  scrollElRef: ListRef
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const ProfileFeedgens = React.forwardRef<
  SectionRef,
  ProfileFeedgensProps
>(function ProfileFeedgensImpl(
  {did, scrollElRef, headerOffset, enabled, style, testID},
  ref,
) {
  const pal = usePalette('default')
  const theme = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const opts = React.useMemo(() => ({enabled}), [enabled])
  const {
    data,
    isFetching,
    isFetched,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useProfileFeedgensQuery(did, opts)
  const isEmpty = !isFetching && !data?.pages[0]?.feeds.length
  const {data: preferences} = usePreferencesQuery()

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (!isFetched && isFetching) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      items = items.concat([EMPTY])
    } else if (data?.pages) {
      for (const page of data?.pages) {
        items = items.concat(page.feeds.map(feed => hydrateFeedGenerator(feed)))
      }
    }
    if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isFetched, isFetching, data])

  // events
  // =

  const queryClient = useQueryClient()

  const onScrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    queryClient.invalidateQueries({queryKey: RQKEY(did)})
  }, [scrollElRef, queryClient, headerOffset, did])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh feeds', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more feeds', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItemInner = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY) {
        return (
          <View
            testID="listsEmpty"
            style={[{padding: 18, borderTopWidth: 1}, pal.border]}>
            <Text style={pal.textLight}>
              <Trans>You have no feeds.</Trans>
            </Text>
          </View>
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage message={cleanError(error)} onPressTryAgain={refetch} />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching your lists. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING) {
        return <FeedLoadingPlaceholder />
      }
      if (preferences) {
        return (
          <FeedSourceCardLoaded
            feedUri={item.uri}
            feed={item}
            preferences={preferences}
            style={styles.item}
            showLikes
          />
        )
      }
      return null
    },
    [error, refetch, onPressRetryLoadMore, pal, preferences],
  )

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: any) => item._reactKey || item.uri}
        renderItem={renderItemInner}
        refreshControl={
          <RefreshControl
            refreshing={isPTRing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
            progressViewOffset={headerOffset}
          />
        }
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        style={{paddingTop: headerOffset}}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
        onEndReached={onEndReached}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 18,
  },
})
