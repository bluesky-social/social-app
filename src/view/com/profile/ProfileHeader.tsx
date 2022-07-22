import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native'
import {OnNavigateContent} from '../../routes/types'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {useStores} from '../../../state'
import {pluralize} from '../../lib/strings'
import {s} from '../../lib/styles'
import {AVIS} from '../../lib/assets'

export const ProfileHeader = observer(function ProfileHeader({
  user,
}: // onNavigateContent,
{
  user: string
  onNavigateContent: OnNavigateContent
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
        <Text style={[s.gray]}>@{view.name}</Text>
      </View>
      {view.description && (
        <Text style={[s.mb5, s.f15, s['lh15-1.3']]}>{view.description}</Text>
      )}
      <View style={s.flexRow}>
        <View style={[s.flexRow, s.mr10]}>
          <Text style={[s.bold, s.mr2]}>{view.followersCount}</Text>
          <Text style={s.gray}>
            {pluralize(view.followersCount, 'follower')}
          </Text>
        </View>
        <View style={[s.flexRow, s.mr10]}>
          <Text style={[s.bold, s.mr2]}>{view.followsCount}</Text>
          <Text style={s.gray}>following</Text>
        </View>
        <View style={[s.flexRow, s.mr10]}>
          <Text style={[s.bold, s.mr2]}>{view.postsCount}</Text>
          <Text style={s.gray}>{pluralize(view.postsCount, 'post')}</Text>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
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
