import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  UserFollowsViewModel,
  FollowItem,
} from '../../../state/models/user-follows-view'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import {AVIS} from '../../lib/assets'

export const ProfileFollows = observer(function ProfileFollows({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const [view, setView] = useState<UserFollowsViewModel | undefined>()

  useEffect(() => {
    if (view?.params.user === name) {
      console.log('User follows doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching user follows', name)
    const newView = new UserFollowsViewModel(store, {user: name})
    setView(newView)
    newView
      .setup()
      .catch(err => console.error('Failed to fetch user follows', err))
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
  const renderItem = ({item}: {item: FollowItem}) => <User item={item} />
  return (
    <View>
      <FlatList
        data={view.follows}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
      />
    </View>
  )
})

const User = ({item}: {item: FollowItem}) => {
  const store = useStores()
  const onPressOuter = () => {
    store.nav.navigate(`/profile/${item.name}`)
  }
  return (
    <TouchableOpacity style={styles.outer} onPress={onPressOuter}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Image
            style={styles.avi}
            source={AVIS[item.name] || AVIS['alice.com']}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold]}>{item.displayName}</Text>
          <Text style={[s.f14, s.gray]}>@{item.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    backgroundColor: '#fff',
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
    borderRadius: 30,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
})
