import React from 'react'
import {Text, Button, View} from 'react-native'
import {Shell} from '../platform/shell'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../state'

export function Login({navigation}: RootTabsScreenProps<'Login'>) {
  const store = useStores()
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Sign In</Text>
        <Button title="Login" onPress={() => store.session.setAuthed(true)} />
        <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      </View>
    </Shell>
  )
}
