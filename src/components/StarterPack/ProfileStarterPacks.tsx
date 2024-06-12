import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyGraphGetActorStarterPacks} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {InfiniteData, UseInfiniteQueryResult} from '@tanstack/react-query'

import {useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {usePreferencesQuery} from 'state/queries/preferences'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {List, ListRef} from 'view/com/util/List'
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
  starterPacksQuery: UseInfiniteQueryResult<
    InfiniteData<AppBskyGraphGetActorStarterPacks.OutputSchema, unknown>,
    Error
  >
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
  {
    starterPacksQuery: query,
    scrollElRef,
    headerOffset,
    enabled,
    style,
    testID,
    setScrollViewTag,
  },
  ref,
) {
  const pal = usePalette('default')
  const theme = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data: pages, refetch, isFetching, hasNextPage, fetchNextPage} = query
  const {data: preferences} = usePreferencesQuery()

  const isEmpty = pages?.pages.length === 0

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (isEmpty) {
      items = items.concat([EMPTY])
    } else if (pages?.pages) {
      items = pages?.pages.flatMap(page => page.starterPacks)
    }
    if (!isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isEmpty, pages])

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
    if (isFetching || !hasNextPage) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more starter packs', {message: err})
    }
  }, [isFetching, hasNextPage, fetchNextPage])

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
    [pal, preferences],
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
