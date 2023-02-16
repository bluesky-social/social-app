import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  RepostedByViewModel,
  RepostedByItem,
} from '../../../state/models/reposted-by-view'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from '../../../state'

export const PostRepostedBy = observer(function PostRepostedBy({
  uri,
}: {
  uri: string
}) {
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
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <View>
        <ErrorMessage message={view.error} onPressTryAgain={onRefresh} />
      </View>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: RepostedByItem}) => (
    <ProfileCardWithFollowBtn
      key={item.did}
      did={item.did}
      declarationCid={item.declaration.cid}
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
      refreshing={view.isRefreshing}
      onRefresh={onRefresh}
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
