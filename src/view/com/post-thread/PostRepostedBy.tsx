import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {
  RepostedByViewModel,
  RepostedByItem,
} from 'state/models/reposted-by-view'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

export const PostRepostedBy = observer(function PostRepostedBy({
  uri,
}: {
  uri: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const view = React.useMemo(
    () => new RepostedByViewModel(store, {uri}),
    [store, uri],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch reposts', err))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more reposts', err),
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
    <ProfileCardWithFollowBtn
      key={item.did}
      did={item.did}
      handle={item.handle}
      displayName={item.displayName}
      avatar={item.avatar}
      isFollowedBy={!!item.viewer?.followedBy}
    />
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
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {view.isLoading && <ActivityIndicator />}
        </View>
      )}
      extraData={view.isLoading}
    />
  )
})

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
