import React, {useState, useEffect, useLayoutEffect} from 'react'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Feed} from '../com/notifications/Feed'
import {useStores} from '../../state'
import {AVIS} from '../lib/assets'
import {ScreenParams} from '../routes'
import {useLoadEffect} from '../lib/navigation'

export const Notifications = ({params}: ScreenParams) => {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const store = useStores()
  useLoadEffect(() => {
    store.nav.setTitle('Notifications')
    console.log('Fetching notifications feed')
    store.notesFeed.setup().then(() => setHasSetup(true))
  }, [store.notesFeed])

  // TODO
  // useEffect(() => {
  //   return navigation.addListener('focus', () => {
  //     if (hasSetup) {
  //       console.log('Updating notifications feed')
  //       store.notesFeed.update()
  //     }
  //   })
  // }, [navigation, store.notesFeed, hasSetup])

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Notifications',
  //     headerLeft: () => (
  //       <TouchableOpacity
  //         onPress={() => navigation.push('Profile', {name: 'alice.com'})}>
  //         <Image source={AVIS['alice.com']} style={styles.avi} />
  //       </TouchableOpacity>
  //     ),
  //     headerRight: () => (
  //       <TouchableOpacity
  //         onPress={() => {
  //           navigation.push('Composer', {})
  //         }}>
  //         <FontAwesomeIcon icon="plus" style={{color: '#006bf7'}} />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return (
    <View>
      <Feed view={store.notesFeed} />
    </View>
  )
}

const styles = StyleSheet.create({
  avi: {
    width: 20,
    height: 20,
    borderRadius: 10,
    resizeMode: 'cover',
  },
})
