import React, {useState, useEffect, useLayoutEffect} from 'react'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Shell} from '../../shell'
import {Feed} from '../../com/notifications/Feed'
import type {RootTabsScreenProps} from '../../routes/types'
import {useStores} from '../../../state'
import {AVIS} from '../../lib/assets'

export const Notifications = ({
  navigation,
}: RootTabsScreenProps<'NotificationsTab'>) => {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const store = useStores()
  useEffect(() => {
    console.log('Fetching home feed')
    store.notesFeed.setup().then(() => setHasSetup(true))
  }, [store.notesFeed])

  const onNavigateContent = (screen: string, props: Record<string, string>) => {
    // @ts-ignore it's up to the callers to supply correct params -prf
    navigation.navigate(screen, props)
  }

  useEffect(() => {
    return navigation.addListener('focus', () => {
      if (hasSetup) {
        console.log('Updating home feed')
        store.notesFeed.update()
      }
    })
  }, [navigation, store.notesFeed, hasSetup])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Notifications',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.push('Profile', {name: 'alice.com'})}>
          <Image source={AVIS['alice.com']} style={styles.avi} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.push('Composer', {})
          }}>
          <FontAwesomeIcon icon="plus" style={{color: '#006bf7'}} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  return (
    <Shell>
      <View>
        <Feed view={store.notesFeed} onNavigateContent={onNavigateContent} />
      </View>
    </Shell>
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
