import React from 'react'
import {Text, Button, View} from 'react-native'
import {useStores} from '../../state'

export const NotFound = () => {
  const stores = useStores()
  return (
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 20, fontWeight: 'bold'}}>Page not found</Text>
      <Button title="Home" onPress={() => stores.nav.navigate('/')} />
    </View>
  )
}
