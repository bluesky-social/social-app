import React from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  FlatList,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {ListCard} from './ListCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import {ListsListModel} from 'state/models/lists/lists-list'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

const CURATELISTS_LOADING = {_reactKey: '__curatelists_loading__'}
const MODLISTS_LOADING = {_reactKey: '__modlists_loading__'}
const CURATELISTS_HEADER = {_reactKey: '__curatelists_header__'}
const MODLISTS_HEADER = {_reactKey: '__modlists_header__'}
const CURATELISTS_EMPTY = {_reactKey: '__curatelists_empty__'}
const MODLISTS_EMPTY = {_reactKey: '__modlists_empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const ListsList = observer(function ListsListImpl({
  listsList,
  purpose,
  style,
  onPressTryAgain,
  onPressCreateNew,
  renderItem,
  testID,
}: {
  listsList: ListsListModel
  purpose?: 'curate' | 'mod' // if undefined, all
  style?: StyleProp<ViewStyle>
  onPressCreateNew: (purpose: string) => void
  onPressTryAgain?: () => void
  renderItem?: (list: GraphDefs.ListView) => JSX.Element
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
    if (!purpose || purpose === 'curate') {
      items = items.concat([CURATELISTS_HEADER])
      if (!listsList.hasLoaded && listsList.isLoading) {
        items = items.concat([CURATELISTS_LOADING])
      } else if (listsList.isCuratelistsEmpty) {
        items = items.concat([CURATELISTS_EMPTY])
      } else {
        items = items.concat(listsList.curatelists)
      }
    }
    if (!purpose || purpose === 'mod') {
      items = items.concat([MODLISTS_HEADER])
      if (!listsList.hasLoaded && listsList.isLoading) {
        items = items.concat([MODLISTS_LOADING])
      } else if (listsList.isModlistsEmpty) {
        items = items.concat([MODLISTS_EMPTY])
      } else {
        items = items.concat(listsList.modlists)
      }
    }
    if (listsList.loadMoreError) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [
    purpose,
    listsList.hasError,
    listsList.hasLoaded,
    listsList.isLoading,
    listsList.modlists,
    listsList.curatelists,
    listsList.isCuratelistsEmpty,
    listsList.isModlistsEmpty,
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
      listsList.rootStore.log.error('Failed to refresh lists', err)
    }
    setIsRefreshing(false)
  }, [listsList, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    track('Lists:onEndReached')
    try {
      await listsList.loadMore()
    } catch (err) {
      listsList.rootStore.log.error('Failed to load more lists', err)
    }
  }, [listsList, track])

  const onPressRetryLoadMore = React.useCallback(() => {
    listsList.retryLoadMore()
  }, [listsList])

  // rendering
  // =

  const renderItemInner = React.useCallback(
    ({item}: {item: any}) => {
      if (item === CURATELISTS_EMPTY) {
        return <Text style={{padding: 16}}>Empty TODO</Text>
      } else if (item === MODLISTS_EMPTY) {
        return <Text style={{padding: 16}}>Empty TODO</Text>
      } else if (item === CURATELISTS_HEADER) {
        return (
          <Header
            title="User Lists"
            description="Public, shareable lists which can drive feeds."
            onPress={() => onPressCreateNew('app.bsky.graph.defs#curatelist')}
          />
        )
      } else if (item === MODLISTS_HEADER) {
        return (
          <Header
            title="Moderation Lists"
            description="Public, shareable lists of users to mute or block in bulk."
            onPress={() => onPressCreateNew('app.bsky.graph.defs#modlist')}
            style={{
              marginTop: !purpose ? 20 : 0,
              borderTopWidth: !purpose ? 1 : 0,
            }}
          />
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
      } else if (item === CURATELISTS_LOADING || item === MODLISTS_LOADING) {
        return (
          <View style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      return renderItem ? (
        renderItem(item)
      ) : (
        <ListCard
          list={item}
          testID={`list-${item.name}`}
          style={styles.item}
        />
      )
    },
    [
      purpose,
      listsList,
      onPressTryAgain,
      onPressRetryLoadMore,
      onPressCreateNew,
      renderItem,
    ],
  )

  return (
    <View testID={testID} style={style}>
      {data.length > 0 && (
        <FlatList
          testID={testID ? `${testID}-flatlist` : undefined}
          data={data}
          keyExtractor={item => item._reactKey}
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

function Header({
  title,
  description,
  onPress,
  style,
}: {
  title: string
  description: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
        },
        pal.border,
        style,
      ]}>
      <View style={{flex: 1}}>
        <Text type="title-lg" style={[pal.text, s.bold]}>
          {title}
        </Text>
        <Text style={pal.textLight}>{description}</Text>
      </View>
      <View>
        <Button type="default" onPress={onPress} style={styles.createNewButton}>
          <FontAwesomeIcon
            icon="plus"
            style={pal.text as FontAwesomeIconStyle}
          />
          <Text type="button" style={pal.text}>
            New
          </Text>
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  createNewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedFooter: {paddingTop: 20},
  item: {
    paddingHorizontal: 18,
  },
})
