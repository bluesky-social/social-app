import React from 'react'
import {Text, Button, View, ActivityIndicator} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Shell} from '../platform/shell'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../state'

export const Login = observer(({navigation}: RootTabsScreenProps<'Login'>) => {
  const store = useStores()
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Sign In</Text>
        {store.session.uiError ?? <Text>{store.session.uiError}</Text>}
        {!store.session.uiIsProcessing ? (
          <>
            <Button title="Login" onPress={() => store.session.login()} />
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Signup')}
            />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </Shell>
  )
})
