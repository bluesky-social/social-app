import React from 'react'
import {
  findNodeHandle,
  type ListRenderItemInfo,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {RQKEY, useProfileFeedgensQuery} from '#/state/queries/profile-feedgens'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListRef} from '#/view/com/util/List'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, ios, useTheme} from '#/alf'
import * as FeedCard from '#/components/FeedCard'
import {ListFooter} from '#/components/Lists'

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
  setScrollViewTag: (tag: number | null) => void
}

export const ProfileFeedgens = React.forwardRef<
  SectionRef,
  ProfileFeedgensProps
>(function ProfileFeedgensImpl(
  {did, scrollElRef, headerOffset, enabled, style, testID, setScrollViewTag},
  ref,
) {
  const {_} = useLingui()
  const t = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const opts = React.useMemo(() => ({enabled}), [enabled])
  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useProfileFeedgensQuery(did, opts)
  const isEmpty = !isPending && !data?.pages[0]?.feeds.length
  const {data: preferences} = usePreferencesQuery()

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (isPending) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      items = items.concat([EMPTY])
    } else if (data?.pages) {
      for (const page of data?.pages) {
        items = items.concat(page.feeds)
      }
    } else if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isPending, data])

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
      logger.error('Failed to refresh feeds', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more feeds', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<any>) => {
      if (item === EMPTY) {
        return (
          <EmptyState
            icon="hashtag"
            message={_(msg`You have no feeds.`)}
            testID="listsEmpty"
          />
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage message={cleanError(error)} onPressTryAgain={refetch} />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching your lists. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING) {
        return <FeedLoadingPlaceholder />
      }
      if (preferences) {
        return (
          <View
            style={[
              (index !== 0 || isWeb) && a.border_t,
              t.atoms.border_contrast_low,
              a.px_lg,
              a.py_lg,
            ]}>
            <FeedCard.Default view={item} />
          </View>
        )
      }
      return null
    },
    [_, t, error, refetch, onPressRetryLoadMore, preferences],
  )

  React.useEffect(() => {
    if (enabled && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [enabled, scrollElRef, setScrollViewTag])

  const ProfileFeedgensFooter = React.useCallback(() => {
    return (
      <ListFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onRetry={fetchNextPage}
        error={cleanError(error)}
        height={180 + headerOffset}
      />
    )
  }, [hasNextPage, error, isFetchingNextPage, headerOffset, fetchNextPage])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={ProfileFeedgensFooter}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        progressViewOffset={ios(0)}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
      />
    </View>
  )
})

function keyExtractor(item: any) {
  return item._reactKey || item.uri
}
