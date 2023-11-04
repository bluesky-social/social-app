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
import {observer} from 'mobx-react-lite'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {ListCard} from './ListCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {Text} from '../util/text/Text'
import {ListsListModel} from 'state/models/lists/lists-list'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {FlatList} from '../util/Views.web'
import {s} from 'lib/styles'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const ListsList = observer(function ListsListImpl({
  listsList,
  inline,
  style,
  onPressTryAgain,
  renderItem,
  testID,
}: {
  listsList: ListsListModel
  inline?: boolean
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
  renderItem?: (list: GraphDefs.ListView, index: number) => JSX.Element
  testID?: string
}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const data = React.useMemo(() => {
    let items: any[] = []
    if (listsList.hasError) {
      items = items.concat([ERROR_ITEM])
    }
    if (!listsList.hasLoaded && listsList.isLoading) {
      items = items.concat([LOADING])
    } else if (listsList.isEmpty) {
      items = items.concat([EMPTY])
    } else {
      items = items.concat(listsList.lists)
    }
    if (listsList.loadMoreError) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [
    listsList.hasError,
    listsList.hasLoaded,
    listsList.isLoading,
    listsList.lists,
    listsList.isEmpty,
    listsList.loadMoreError,
  ])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Lists:onRefresh')
    setIsRefreshing(true)
    try {
      await listsList.refresh()
    } catch (err) {
      listsList.rootStore.log.error('Failed to refresh lists', {error: err})
    }
    setIsRefreshing(false)
  }, [listsList, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    track('Lists:onEndReached')
    try {
      await listsList.loadMore()
    } catch (err) {
      listsList.rootStore.log.error('Failed to load more lists', {error: err})
    }
  }, [listsList, track])

  const onPressRetryLoadMore = React.useCallback(() => {
    listsList.retryLoadMore()
  }, [listsList])

  // rendering
  // =

  const renderItemInner = React.useCallback(
    ({item, index}: {item: any; index: number}) => {
      if (item === EMPTY) {
        return (
          <View
            testID="listsEmpty"
            style={[{padding: 18, borderTopWidth: 1}, pal.border]}>
            <Text style={pal.textLight}>You have no lists.</Text>
          </View>
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={listsList.error}
            onPressTryAgain={onPressTryAgain}
          />
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
      return renderItem ? (
        renderItem(item, index)
      ) : (
        <ListCard
          list={item}
          testID={`list-${item.name}`}
          style={styles.item}
        />
      )
    },
    [listsList, onPressTryAgain, onPressRetryLoadMore, renderItem, pal],
  )

  const FlatListCom = inline ? RNFlatList : FlatList
  return (
    <View testID={testID} style={style}>
      {data.length > 0 && (
        <FlatListCom
          testID={testID ? `${testID}-flatlist` : undefined}
          data={data}
          keyExtractor={(item: any) => item._reactKey}
          renderItem={renderItemInner}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          contentContainerStyle={[s.contentContainer]}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          removeClippedSubviews={true}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
})
