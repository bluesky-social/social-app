import React from 'react'
import {Button, StyleSheet, View} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/text/Text'
import {NavigationProp} from 'lib/routes/types'

export const NotFound = () => {
  const navigation = useNavigation<NavigationProp>()

  const onPressHome = React.useCallback(() => {
    navigation.navigate('HomeTab') // TODO go fully home
  }, [navigation])

  return (
    <View testID="notFoundView">
      <ViewHeader title="Page not found" />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Button
          testID="navigateHomeButton"
          title="Home"
          onPress={onPressHome}
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
