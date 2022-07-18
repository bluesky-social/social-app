import React from 'react'
import {Text, Button, View} from 'react-native'
import {Shell} from '../shell'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../../state'

export function Home({navigation}: RootTabsScreenProps<'Home'>) {
  const store = useStores()
  return (
    <Shell>
      <View style={{alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Home</Text>
        <Button
          title="Go to Jane's profile"
          onPress={() => navigation.navigate('Profile', {name: 'Jane'})}
        />
        <Button title="Logout" onPress={() => store.session.logout()} />
      </View>
    </Shell>
  )
}
