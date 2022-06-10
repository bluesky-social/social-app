import React from 'react'
import {Shell} from '../platform/shell'
import {Text, Button, View} from 'react-native'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../state'

export function Signup({navigation}: RootTabsScreenProps<'Signup'>) {
  const store = useStores()
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Create Account</Text>
        <Button
          title="Create new account"
          onPress={() => store.session.setAuthed(true)}
        />
        <Button
          title="Log in to an existing account"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </Shell>
  )
}
