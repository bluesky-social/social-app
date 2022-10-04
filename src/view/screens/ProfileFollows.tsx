import React, {useEffect} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollows = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(`Followed by ${name}`)
    }
  }, [store, visible, name])

  return (
    <View>
      <Text style={styles.title}>Followed by {name}</Text>
      <ProfileFollowsComponent name={name} />
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
