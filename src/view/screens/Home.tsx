import React, {useEffect} from 'react'
import {View} from 'react-native'
import {Shell} from '../shell'
import {Feed} from '../com/feed/Feed'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../../state'

export function Home({navigation}: RootTabsScreenProps<'Home'>) {
  const store = useStores()
  useEffect(() => {
    console.log('Fetching home feed')
    store.homeFeed.setup()
  }, [store.homeFeed])
  const onNavigateContent = (screen: string, props: Record<string, string>) => {
    navigation.navigate(screen, props)
  }
  return (
    <Shell>
      <View>
        <Feed feed={store.homeFeed} onNavigateContent={onNavigateContent} />
      </View>
    </Shell>
  )
}
