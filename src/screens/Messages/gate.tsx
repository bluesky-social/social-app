import React from 'react'
import {Text, View} from 'react-native'

export function ClipClopGate() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}>
      <Text style={{fontSize: 50}}>🐴</Text>
      <Text style={{textAlign: 'center'}}>Nice try</Text>
    </View>
  )
}
