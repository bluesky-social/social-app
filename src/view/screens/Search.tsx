import React from 'react'
import {Text, View} from 'react-native'
import {ScreenParams} from '../routes'

export const Search = ({params}: ScreenParams) => {
  return (
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 20, fontWeight: 'bold'}}>Search</Text>
    </View>
  )
}
