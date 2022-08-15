import React from 'react'
import {Shell} from '../shell'
import {Text, Button, View} from 'react-native'
import type {ScreensProps} from '../routes/types'

export const NotFound = ({navigation}: ScreensProps<'NotFound'>) => {
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Page not found</Text>
        <Button title="Home" onPress={() => navigation.navigate('HomeTab')} />
      </View>
    </Shell>
  )
}
