import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {RepostedByModel, RepostedByItem} from 'state/models/lists/reposted-by'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

export const PostRepostedBy = observer(function PostRepostedByImpl({
  uri,
}: {
  uri: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const view = React.useMemo(
    () => new RepostedByModel(store, {uri}),
    [store, uri],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch reposts', {error: err}))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more reposts', {error: err}),
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
  const renderItem = ({item}: {item: RepostedByItem}) => (
    <ProfileCardWithFollowBtn key={item.did} profile={item} />
  )
  return (
    <FlatList
      data={view.repostedBy}
      keyExtractor={item => item.did}
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
