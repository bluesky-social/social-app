import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {VotesViewModel, VotesItem} from '../../../state/models/votes-view'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

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
  const renderItem = ({item}: {item: VotesItem}) => <LikedByItem item={item} />
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

const LikedByItem = ({item}: {item: VotesItem}) => {
  const pal = usePalette('default')

  return (
    <Link
      style={[styles.outer, pal.view]}
      href={`/profile/${item.actor.handle}`}
      title={item.actor.handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={item.actor.displayName}
            handle={item.actor.handle}
            avatar={item.actor.avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold, pal.text]}>
            {item.actor.displayName || item.actor.handle}
          </Text>
          <Text style={[s.f14, s.gray5, pal.textLight]}>
            @{item.actor.handle}
          </Text>
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 60,
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
