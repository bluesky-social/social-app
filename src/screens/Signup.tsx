import React from 'react'
import {Text, Button, View, ActivityIndicator} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Shell} from '../platform/shell'
import type {RootTabsScreenProps} from '../routes/types'
import {useStores} from '../state'

export const Signup = observer(
  ({navigation}: RootTabsScreenProps<'Signup'>) => {
    const store = useStores()
    return (
      <Shell>
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, fontWeight: 'bold'}}>Create Account</Text>
          {store.session.uiError ?? <Text>{store.session.uiError}</Text>}
          {store.session.uiState === 'idle' ? (
            <>
              <Button
                title="Create new account"
                onPress={() =>
                  store.session.createTestAccount('http://localhost:1986')
                }
              />
              <Button
                title="Log in to an existing account"
                onPress={() => navigation.navigate('Login')}
              />
            </>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </Shell>
    )
  },
)
