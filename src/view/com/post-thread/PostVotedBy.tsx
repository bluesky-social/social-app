import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {VotesViewModel, VoteItem} from 'state/models/votes-view'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {useStores} from 'state/index'

export const PostVotedBy = observer(function PostVotedBy({
  uri,
  direction,
}: {
  uri: string
  direction: 'up' | 'down'
}) {
  const store = useStores()
  const view = React.useMemo(
    () => new VotesViewModel(store, {uri, direction}),
    [store, uri, direction],
  )

  useEffect(() => {
    view.loadMore().catch(err => store.log.error('Failed to fetch votes', err))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err => view?.rootStore.log.error('Failed to load more votes', err))
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
  const renderItem = ({item}: {item: VoteItem}) => (
    <ProfileCardWithFollowBtn
      key={item.actor.did}
      did={item.actor.did}
      declarationCid={item.actor.declaration.cid}
      handle={item.actor.handle}
      displayName={item.actor.displayName}
      avatar={item.actor.avatar}
      isFollowedBy={!!item.actor.viewer?.followedBy}
    />
  )
  return (
    <FlatList
      data={view.votes}
      keyExtractor={item => item.actor.did}
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
