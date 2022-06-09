import React from 'react'
import {Text, Button, View, SafeAreaView} from 'react-native'
import type {RootStackScreenProps} from '../routes/types'
import {useStores} from '../state'

export function Login({navigation}: RootStackScreenProps<'Login'>) {
  const store = useStores()
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Text>Welcome! Time to sign in</Text>
        <Button title="Login" onPress={() => store.session.setAuthed(true)} />
        <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      </View>
    </SafeAreaView>
  )
}
