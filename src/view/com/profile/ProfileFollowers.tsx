import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  UserFollowersViewModel,
  FollowerItem,
} from '../../../state/models/user-followers-view'
import {Link} from '../util/Link'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {AVIS} from '../../lib/assets'

export const ProfileFollowers = observer(function ProfileFollowers({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const [view, setView] = useState<UserFollowersViewModel | undefined>()

  useEffect(() => {
    if (view?.params.user === name) {
      console.log('User followers doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching user followers', name)
    const newView = new UserFollowersViewModel(store, {user: name})
    setView(newView)
    newView
      .setup()
      .catch(err => console.error('Failed to fetch user followers', err))
  }, [name, view?.params.user, store])

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
        <Text>{view.error}</Text>
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
  return (
    <Link style={styles.outer} href={`/profile/${item.name}`} title={item.name}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Image
            style={styles.avi}
            source={AVIS[item.name] || AVIS['alice.com']}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold]}>{item.displayName}</Text>
          <Text style={[s.f14, s.gray5]}>@{item.name}</Text>
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
    backgroundColor: colors.white,
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
})
