import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {LikesModel, LikeItem} from 'state/models/lists/likes'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

export const PostLikedBy = observer(function PostLikedByImpl({
  uri,
}: {
  uri: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const view = React.useMemo(() => new LikesModel(store, {uri}), [store, uri])

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch likes', {error: err}))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more likes', {error: err}),
      )
  }

  if (!view.hasLoaded) {
    return (
      <CenteredView>
        <ActivityIndicator />
      </CenteredView>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <CenteredView>
        <ErrorMessage message={view.error} onPressTryAgain={onRefresh} />
      </CenteredView>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: LikeItem}) => (
    <ProfileCardWithFollowBtn key={item.actor.did} profile={item.actor} />
  )
  return (
    <FlatList
      data={view.likes}
      keyExtractor={item => item.actor.did}
      refreshControl={
        <RefreshControl
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onEndReached={onEndReached}
      renderItem={renderItem}
      initialNumToRender={15}
      // FIXME(dan)
      // eslint-disable-next-line react/no-unstable-nested-components
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {view.isLoading && <ActivityIndicator />}
        </View>
      )}
      extraData={view.isLoading}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
})

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
