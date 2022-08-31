import React, {useState, useEffect, useLayoutEffect} from 'react'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Feed} from '../com/feed/Feed'
import {useStores} from '../../state'
import {useLoadEffect} from '../lib/navigation'
import {AVIS} from '../lib/assets'
import {ScreenParams} from '../routes'

export function Home({params}: ScreenParams) {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const store = useStores()
  useLoadEffect(() => {
    store.nav.setTitle('Home')
    console.log('Fetching home feed')
    store.homeFeed.setup().then(() => setHasSetup(true))
  }, [store.nav, store.homeFeed])

  // TODO
  // useEffect(() => {
  //   return navigation.addListener('focus', () => {
  //     if (hasSetup) {
  //       console.log('Updating home feed')
  //       store.homeFeed.update()
  //     }
  //   })
  // }, [navigation, store.homeFeed, hasSetup])

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'V I B E',
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
      <Feed feed={store.homeFeed} />
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
