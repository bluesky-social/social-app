import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  UserFollowersViewModel,
  FollowerItem,
} from '../../../state/models/user-followers-view'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {useStores} from '../../../state'

export const ProfileFollowers = observer(function ProfileFollowers({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const view = React.useMemo(
    () => new UserFollowersViewModel(store, {user: name}),
    [store, name],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch user followers', err))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more followers', err),
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
  const renderItem = ({item}: {item: FollowerItem}) => (
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
      data={view.followers}
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
