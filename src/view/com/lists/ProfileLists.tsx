import React, {MutableRefObject} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {FlatList} from '../util/Views'
import {ListCard} from './ListCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {Text} from '../util/text/Text'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useProfileListsQuery} from '#/state/queries/profile-lists'
import {OnScrollHandler} from '#/lib/hooks/useOnMainScroll'
import {logger} from '#/logger'
import {Trans} from '@lingui/macro'
import {cleanError} from '#/lib/strings/errors'
import {useAnimatedScrollHandler} from 'react-native-reanimated'
import {useTheme} from '#/lib/ThemeContext'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export function ProfileLists({
  did,
  scrollElRef,
  onScroll,
  scrollEventThrottle,
  headerOffset,
  enabled,
  style,
  testID,
}: {
  did: string
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onScroll?: OnScrollHandler
  scrollEventThrottle?: number
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
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
  } = useProfileListsQuery(did, opts)
  const isEmpty = !isFetching && !data?.pages[0]?.lists.length

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
        items = items.concat(page.lists)
      }
    }
    if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isFetched, isFetching, data])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Lists:onRefresh')
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, track, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    track('Lists:onEndReached')
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more lists', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage, track])

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
              <Trans>You have no lists.</Trans>
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
        return (
          <View style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      return (
        <ListCard
          list={item}
          testID={`list-${item.name}`}
          style={styles.item}
        />
      )
    },
    [error, refetch, onPressRetryLoadMore, pal],
  )

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View testID={testID} style={style}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: any) => item._reactKey}
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
        onScroll={onScroll != null ? scrollHandler : undefined}
        scrollEventThrottle={scrollEventThrottle}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
        onEndReached={onEndReached}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
})
