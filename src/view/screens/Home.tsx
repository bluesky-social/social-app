import React, {useEffect} from 'react'
import {Text, View} from 'react-native'
import {Shell} from '../shell'
import {Feed} from '../com/Feed'
// import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../../state'

export function Home(/*{navigation}: RootTabsScreenProps<'Home'>*/) {
  const store = useStores()
  useEffect(() => {
    console.log('Fetching home feed')
    store.homeFeed.fetch()
  }, [store.homeFeed])
  return (
    <Shell>
      <View>
        <Feed feed={store.homeFeed} />
      </View>
    </Shell>
  )
}
