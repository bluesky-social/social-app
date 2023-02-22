import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {UserFollowsViewModel, FollowItem} from 'state/models/user-follows-view'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {useStores} from 'state/index'

export const ProfileFollows = observer(function ProfileFollows({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const view = React.useMemo(
    () => new UserFollowsViewModel(store, {user: name}),
    [store, name],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch user follows', err))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more follows', err),
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
  const renderItem = ({item}: {item: FollowItem}) => (
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
      data={view.follows}
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
