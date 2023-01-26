import React from 'react'
import {Text, View, StyleSheet} from 'react-native'

export const DesktopRightColumn: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Right Column</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 'calc(50vw - 500px)',
    width: '200px',
    height: '100%',
  },
})
