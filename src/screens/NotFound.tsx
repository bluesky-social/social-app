import React from 'react'
import {Shell} from '../platform/shell'
import {Text, Button, View} from 'react-native'
import type {RootTabsScreenProps} from '../routes/types'

export const NotFound = ({navigation}: RootTabsScreenProps<'NotFound'>) => {
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Page not found</Text>
        <Button title="Home" onPress={() => navigation.navigate('Home')} />
      </View>
    </Shell>
  )
}
