import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useActorStarterPacksQuery} from 'state/queries/actor-starter-packs'
import {usePreferencesQuery} from 'state/queries/preferences'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {List, ListRef} from 'view/com/util/List'
import {LoadMoreRetryBtn} from 'view/com/util/LoadMoreRetryBtn'
import {Text} from 'view/com/util/text/Text'
import {StarterPackCard} from '#/components/StarterPack/StarterPackCard'

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

export const ProfileStarterPacks = React.forwardRef<
  SectionRef,
  ProfileFeedgensProps
>(function ProfileFeedgensImpl(
  {did, scrollElRef, headerOffset, enabled, style, testID, setScrollViewTag},
  ref,
) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const theme = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)

  const {
    data,
    isFetching,
    isError,
    isFetched,
    fetchNextPage,
    refetch,
    hasNextPage,
    error,
  } = useActorStarterPacksQuery({
    did,
  })
  const {data: preferences} = usePreferencesQuery()

  const isEmpty = !isFetching && data?.pages.length === 0

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
      items = data?.pages.flatMap(page => page.starterPacks)
    }
    if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isFetched, isFetching, data])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {},
  }))

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh starter packs', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more starter packs', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<any>) => {
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
          <StarterPackCard
            starterPack={item}
            type="list"
            hideTopBorder={!isWeb && index === 0}
          />
        )
      }
      return null
    },
    [error, refetch, onPressRetryLoadMore, pal, preferences, _],
  )

  React.useEffect(() => {
    if (enabled && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [enabled, scrollElRef, setScrollViewTag])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: any) => item._reactKey || item.uri}
        renderItem={renderItem}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        contentContainerStyle={isNative && {paddingBottom: headerOffset + 100}}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
      />
    </View>
  )
})
