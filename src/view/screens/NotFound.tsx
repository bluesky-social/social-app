import React from 'react'
import {Button, StyleSheet, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/text/Text'
import {useStores} from '../../state'

export const NotFound = () => {
  const stores = useStores()
  return (
    <View testID="notFoundView">
      <ViewHeader title="Page not found" />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Button
          testID="navigateHomeButton"
          title="Home"
          onPress={() => stores.nav.navigate('/')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },
})
