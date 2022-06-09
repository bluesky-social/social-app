import React from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  Button,
  useColorScheme,
  View,
} from 'react-native'
import type {RootStackScreenProps} from '../routes/types'

export const NotFound = ({navigation}: RootStackScreenProps<'NotFound'>) => {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text>Page not found</Text>
          <Button title="Home" onPress={() => navigation.navigate('Primary')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
