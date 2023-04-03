import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {UserFollowsModel, FollowItem} from 'state/models/lists/user-follows'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

export const ProfileFollows = observer(function ProfileFollows({
  name,
}: {
  name: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const view = React.useMemo(
    () => new UserFollowsModel(store, {actor: name}),
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
