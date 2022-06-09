import React from 'react'
import {Text, Button, View, SafeAreaView} from 'react-native'
import type {PrimaryTabScreenProps} from '../routes/types'

export const Home = ({navigation}: PrimaryTabScreenProps<'Home'>) => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Text>Hello world</Text>
        <Button
          title="Go to Jane's profile"
          onPress={() => navigation.navigate('Profile', {name: 'Jane'})}
        />
      </View>
    </SafeAreaView>
  )
}
