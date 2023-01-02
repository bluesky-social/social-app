import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  UserFollowersViewModel,
  FollowerItem,
} from '../../../state/models/user-followers-view'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

export const ProfileFollowers = observer(function ProfileFollowers({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const [view, setView] = useState<UserFollowersViewModel | undefined>()

  useEffect(() => {
    if (view?.params.user === name) {
      return // no change needed? or trigger refresh?
    }
    const newView = new UserFollowersViewModel(store, {user: name})
    setView(newView)
    newView
      .setup()
      .catch(err =>
        store.log.error('Failed to fetch user followers', err.toString()),
      )
  }, [name, view?.params.user, store])

  const onRefresh = () => {
    view?.refresh()
  }

  // loading
  // =
  if (
    !view ||
    (view.isLoading && !view.isRefreshing) ||
    view.params.user !== name
  ) {
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
        <ErrorMessage
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onRefresh}
        />
      </View>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: FollowerItem}) => <User item={item} />
  return (
    <View>
      <FlatList
        data={view.followers}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
      />
    </View>
  )
})

const User = ({item}: {item: FollowerItem}) => {
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
          <Text type="body2" style={[pal.textLight]}>
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
})
