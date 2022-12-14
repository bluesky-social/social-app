import React from 'react'
import {Image, StyleSheet, useWindowDimensions, View} from 'react-native'

export function Component({uri}: {uri: string}) {
  const winDim = useWindowDimensions()
  const top = winDim.height / 2 - (winDim.width - 40) / 2 - 100
  console.log(uri)
  return (
    <View style={[styles.container, {top}]}>
      <Image style={styles.image} source={{uri}} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
  },
  image: {
    resizeMode: 'contain',
    width: '100%',
    aspectRatio: 1,
  },
})
