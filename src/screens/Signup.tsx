import React from 'react'
import {Text, Button, View, SafeAreaView} from 'react-native'
import type {RootStackScreenProps} from '../routes/types'
import {useStores} from '../state'

export function Signup({navigation}: RootStackScreenProps<'Signup'>) {
  const store = useStores()
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Text>Let's create your account</Text>
        <Button
          title="Create new account"
          onPress={() => store.session.setAuthed(true)}
        />
        <Button
          title="Log in to an existing account"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </SafeAreaView>
  )
}
