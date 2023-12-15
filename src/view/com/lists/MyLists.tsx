import React from 'react'
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {ListCard} from './ListCard'
import {MyListsFilter, useMyListsQuery} from '#/state/queries/my-lists'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {List} from '../util/List'
import {s} from 'lib/styles'
import {logger} from '#/logger'
import {Trans} from '@lingui/macro'
import {cleanError} from '#/lib/strings/errors'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}

export function MyLists({
  filter,
  inline,
  style,
  renderItem,
  testID,
}: {
  filter: MyListsFilter
  inline?: boolean
  style?: StyleProp<ViewStyle>
  renderItem?: (list: GraphDefs.ListView, index: number) => JSX.Element
  testID?: string
}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyListsQuery(filter)
  const isEmpty = !isFetching && !data?.length

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (!isFetched && isFetching) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      items = items.concat([EMPTY])
    } else {
      items = items.concat(data)
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

  // rendering
  // =

  const renderItemInner = React.useCallback(
    ({item, index}: {item: any; index: number}) => {
      if (item === EMPTY) {
        return (
          <View
            key={item._reactKey}
            testID="listsEmpty"
            style={[{padding: 18, borderTopWidth: 1}, pal.border]}>
            <Text style={pal.textLight}>
              <Trans>You have no lists.</Trans>
            </Text>
          </View>
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            key={item._reactKey}
            message={cleanError(error)}
            onPressTryAgain={onRefresh}
          />
        )
      } else if (item === LOADING) {
        return (
          <View key={item._reactKey} style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      return renderItem ? (
        renderItem(item, index)
      ) : (
        <ListCard
          key={item.uri}
          list={item}
          testID={`list-${item.name}`}
          style={styles.item}
        />
      )
    },
    [error, onRefresh, renderItem, pal],
  )

  const FlatListCom = inline ? RNFlatList : List
  return (
    <View testID={testID} style={style}>
      {items.length > 0 && (
        <FlatListCom
          testID={testID ? `${testID}-flatlist` : undefined}
          data={items}
          keyExtractor={item => (item.uri ? item.uri : item._reactKey)}
          renderItem={renderItemInner}
          refreshControl={
            <RefreshControl
              refreshing={isPTRing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          contentContainerStyle={[s.contentContainer]}
          removeClippedSubviews={true}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
})
