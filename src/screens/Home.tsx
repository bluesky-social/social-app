import React from 'react'
import {Text, Button, View, SafeAreaView} from 'react-native'
import type {PrimaryTabScreenProps} from '../routes/types'
import {useStores} from '../state'

export function Home({navigation}: PrimaryTabScreenProps<'Home'>) {
  const store = useStores()
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Text>Hello world</Text>
        <Button
          title="Go to Jane's profile"
          onPress={() => navigation.navigate('Profile', {name: 'Jane'})}
        />
        <Button title="Logout" onPress={() => store.session.setAuthed(false)} />
      </View>
    </SafeAreaView>
  )
}
