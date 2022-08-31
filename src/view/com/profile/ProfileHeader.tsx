import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {useStores} from '../../../state'
import {pluralize} from '../../lib/strings'
import {s, colors} from '../../lib/styles'
import {AVIS} from '../../lib/assets'
import Toast from '../util/Toast'

export const ProfileHeader = observer(function ProfileHeader({
  user,
}: {
  user: string
}) {
  const store = useStores()
  const [view, setView] = useState<ProfileViewModel | undefined>()

  useEffect(() => {
    if (view?.params.user === user) {
      console.log('Profile header doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching profile', user)
    const newView = new ProfileViewModel(store, {user: user})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch profile', err))
  }, [user, view?.params.user, store])

  const onPressToggleFollow = () => {
    view?.toggleFollowing().then(
      () => {
        Toast.show(
          `${view.myState.hasFollowed ? 'Following' : 'No longer following'} ${
            view.displayName || view.name
          }`,
          {
            duration: Toast.durations.LONG,
            position: Toast.positions.TOP,
          },
        )
      },
      err => console.error('Failed to toggle follow', err),
    )
  }
  const onPressFollowers = () => {
    store.nav.navigate(`/profile/${user}/followers`)
  }
  const onPressFollows = () => {
    store.nav.navigate(`/profile/${user}/follows`)
  }

  // loading
  // =
  if (
    !view ||
    (view.isLoading && !view.isRefreshing) ||
    view.params.user !== user
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
  return (
    <View style={styles.outer}>
      <Image style={styles.avi} source={AVIS[view.name] || AVIS['alice.com']} />
      <View style={[styles.nameLine, s.mb2]}>
        <Text style={[s.bold, s.f18, s.mr2]}>{view.displayName}</Text>
        <Text style={[s.gray5]}>@{view.name}</Text>
      </View>
      {view.description && (
        <Text style={[s.mb5, s.f15, s['lh15-1.3']]}>{view.description}</Text>
      )}
      <View style={s.flexRow}>
        <TouchableOpacity
          style={[s.flexRow, s.mr10]}
          onPress={onPressFollowers}>
          <Text style={[s.bold, s.mr2]}>{view.followersCount}</Text>
          <Text style={s.gray5}>
            {pluralize(view.followersCount, 'follower')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.flexRow, s.mr10]} onPress={onPressFollows}>
          <Text style={[s.bold, s.mr2]}>{view.followsCount}</Text>
          <Text style={s.gray5}>following</Text>
        </TouchableOpacity>
        <View style={[s.flexRow, s.mr10]}>
          <Text style={[s.bold, s.mr2]}>{view.postsCount}</Text>
          <Text style={s.gray5}>{pluralize(view.postsCount, 'post')}</Text>
        </View>
      </View>
      <View>
        <Button
          title={view.myState.hasFollowed ? 'Unfollow' : 'Follow'}
          onPress={onPressToggleFollow}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: colors.gray2,
  },
  avi: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
})
