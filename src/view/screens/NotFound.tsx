import React from 'react'
import {Text, Button, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from '../../state'

export const NotFound = () => {
  const stores = useStores()
  return (
    <View>
      <ViewHeader title="Page not found" />
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 100,
        }}>
        <Text style={{fontSize: 40, fontWeight: 'bold'}}>Page not found</Text>
        <Button title="Home" onPress={() => stores.nav.navigate('/')} />
      </View>
    </View>
  )
}
