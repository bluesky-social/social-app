import React from 'react'
import {View, ActivityIndicator, StyleSheet} from 'react-native'
import {register} from 'react-native-bundle-splitter'

export const SelectedPhoto = register({
  loader: () => import('./SelectedPhoto'),
  placeholder: () => (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  ),
})

const styles = StyleSheet.create({
  loading: {flex: 1, justifyContent: 'center'},
})
