import React, {MutableRefObject} from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {FlatList} from '../util/Views'
import {ListCard} from './ListCard'
import {ProfileCardFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import {ListsListModel} from 'state/models/lists/lists-list'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'

const LOADING_ITEM = {_reactKey: '__loading__'}
const CREATENEW_ITEM = {_reactKey: '__loading__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const ListsList = observer(
  ({
    listsList,
    style,
    scrollElRef,
    onPressTryAgain,
    onPressCreateNew,
    renderEmptyState,
    testID,
    headerOffset = 0,
  }: {
    listsList: ListsListModel
    style?: StyleProp<ViewStyle>
    scrollElRef?: MutableRefObject<FlatList<any> | null>
    onPressCreateNew: () => void
    onPressTryAgain?: () => void
    renderEmptyState?: () => JSX.Element
    testID?: string
    headerOffset?: number
  }) => {
    const pal = usePalette('default')
    const {track} = useAnalytics()
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const data = React.useMemo(() => {
      let items: any[] = []
      if (listsList.hasLoaded) {
        if (listsList.hasError) {
          items = items.concat([ERROR_ITEM])
        }
        if (listsList.isEmpty) {
          items = items.concat([EMPTY_ITEM])
        } else {
          if (isDesktopWeb) {
            items = items.concat([CREATENEW_ITEM])
          }
          items = items.concat(listsList.lists)
        }
        if (listsList.loadMoreError) {
          items = items.concat([LOAD_MORE_ERROR_ITEM])
        }
      } else if (listsList.isLoading) {
        items = items.concat([LOADING_ITEM])
      }
      return items
    }, [
      listsList.hasError,
      listsList.hasLoaded,
      listsList.isLoading,
      listsList.isEmpty,
      listsList.lists,
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

    const renderItem = React.useCallback(
      ({item}: {item: any}) => {
        if (item === EMPTY_ITEM) {
          if (renderEmptyState) {
            return renderEmptyState()
          }
          return <View />
        } else if (item === CREATENEW_ITEM) {
          return <CreateNewItem onPress={onPressCreateNew} />
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
        } else if (item === LOADING_ITEM) {
          return <ProfileCardFeedLoadingPlaceholder />
        }
        return <ListCard list={item} />
      },
      [listsList, onPressTryAgain, onPressRetryLoadMore, onPressCreateNew],
    )

    const Footer = React.useCallback(
      () =>
        listsList.isLoading ? (
          <View style={styles.feedFooter}>
            <ActivityIndicator />
          </View>
        ) : (
          <View />
        ),
      [listsList],
    )

    return (
      <View testID={testID} style={style}>
        {data.length > 0 && (
          <FlatList
            testID={testID ? `${testID}-flatlist` : undefined}
            ref={scrollElRef}
            data={data}
            keyExtractor={item => item._reactKey}
            renderItem={renderItem}
            ListFooterComponent={Footer}
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
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            removeClippedSubviews={true}
            contentOffset={{x: 0, y: headerOffset * -1}}
            // @ts-ignore our .web version only -prf
            desktopFixedHeight
          />
        )}
      </View>
    )
  },
)

function CreateNewItem({onPress}: {onPress: () => void}) {
  const palInverted = usePalette('inverted')

  return (
    <View style={[styles.createNewContainer]}>
      <Button type="inverted" onPress={onPress} style={styles.createNewButton}>
        <FontAwesomeIcon
          icon="plus"
          style={palInverted.text as FontAwesomeIconStyle}
        />
        <Text type="button" style={palInverted.text}>
          New Mute-list
        </Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  createNewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedFooter: {paddingTop: 20},
})
