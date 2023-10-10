import React, {MutableRefObject} from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  FlatList,
} from 'react-native'
import {AppBskyActorDefs, AppBskyGraphDefs} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {ProfileCardFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {ProfileCard} from '../profile/ProfileCard'
import {Button} from '../util/forms/Button'
import {ListModel} from 'state/models/content/list'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {s} from 'lib/styles'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

export const ListItems = observer(function ListItemsImpl({
  list,
  style,
  scrollElRef,
  onPressTryAgain,
  renderEmptyState,
  testID,
  headerOffset = 0,
}: {
  list: ListModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  renderEmptyState?: () => JSX.Element
  testID?: string
  headerOffset?: number
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const data = React.useMemo(() => {
    let items: any[] = []
    if (list.hasLoaded) {
      if (list.hasError) {
        items = items.concat([ERROR_ITEM])
      }
      if (list.isEmpty) {
        items = items.concat([EMPTY_ITEM])
      } else {
        items = items.concat(list.items)
      }
      if (list.loadMoreError) {
        items = items.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else if (list.isLoading) {
      items = items.concat([LOADING_ITEM])
    }
    return items
  }, [
    list.hasError,
    list.hasLoaded,
    list.isLoading,
    list.isEmpty,
    list.items,
    list.loadMoreError,
  ])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Lists:onRefresh')
    setIsRefreshing(true)
    try {
      await list.refresh()
    } catch (err) {
      list.rootStore.log.error('Failed to refresh lists', err)
    }
    setIsRefreshing(false)
  }, [list, track, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    track('Lists:onEndReached')
    try {
      await list.loadMore()
    } catch (err) {
      list.rootStore.log.error('Failed to load more lists', err)
    }
  }, [list, track])

  const onPressRetryLoadMore = React.useCallback(() => {
    list.retryLoadMore()
  }, [list])

  const onPressEditMembership = React.useCallback(
    (profile: AppBskyActorDefs.ProfileViewBasic) => {
      store.shell.openModal({
        name: 'list-add-remove-user',
        subject: profile.did,
        displayName: profile.displayName || profile.handle,
        onUpdate() {
          list.refresh()
        },
      })
    },
    [store, list],
  )

  // rendering
  // =

  const renderMemberButton = React.useCallback(
    (profile: AppBskyActorDefs.ProfileViewBasic) => {
      if (!list.isOwner) {
        return null
      }
      return (
        <Button
          type="default"
          label="Edit"
          onPress={() => onPressEditMembership(profile)}
        />
      )
    },
    [list, onPressEditMembership],
  )

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_ITEM) {
        if (renderEmptyState) {
          return renderEmptyState()
        }
        return <View />
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={list.error}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching the list. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <ProfileCardFeedLoadingPlaceholder />
      }
      return (
        <ProfileCard
          testID={`user-${
            (item as AppBskyGraphDefs.ListItemView).subject.handle
          }`}
          profile={(item as AppBskyGraphDefs.ListItemView).subject}
          renderButton={renderMemberButton}
        />
      )
    },
    [
      renderMemberButton,
      renderEmptyState,
      list.error,
      onPressTryAgain,
      onPressRetryLoadMore,
    ],
  )

  const Footer = React.useCallback(
    () =>
      list.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [list],
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
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  headerDescription: {
    flex: 1,
    marginTop: 8,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  fakeSelectorItem: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 3,
  },
  feedFooter: {paddingTop: 20},
})
