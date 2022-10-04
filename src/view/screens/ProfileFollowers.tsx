import React, {useEffect} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollowers = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(`Followers of ${name}`)
    }
  }, [store, visible, name])

  return (
    <View>
      <Text style={styles.title}>Followers of {name}</Text>
      <ProfileFollowersComponent name={name} />
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    padding: 10,
  },
})
