import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  UserFollowsViewModel,
  FollowItem,
} from '../../../state/models/user-follows-view'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

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
  const renderItem = ({item}: {item: FollowItem}) => (
    <User key={item.did} item={item} />
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

const User = ({item}: {item: FollowItem}) => {
  const pal = usePalette('default')
  return (
    <Link
      style={[styles.outer, pal.view, pal.border]}
      href={`/profile/${item.handle}`}
      title={item.handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={item.displayName}
            handle={item.handle}
            avatar={item.avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.bold, pal.text]}>
            {item.displayName || item.handle}
          </Text>
          <Text type="sm" style={[pal.textLight]}>
            @{item.handle}
          </Text>
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
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
