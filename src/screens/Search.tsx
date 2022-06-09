import React from 'react'
import {SafeAreaView, ScrollView, Text, Button, View} from 'react-native'
import type {PrimaryTabScreenProps} from '../routes/types'

export const Search = ({navigation}: PrimaryTabScreenProps<'Search'>) => {
  return (
    <SafeAreaView>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text>Hello world</Text>
          <Button
            title="Go to Jane's profile"
            onPress={() => navigation.navigate('Profile', {name: 'Jane'})}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
