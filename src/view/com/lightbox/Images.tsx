import React from 'react'
import {Image, StyleSheet, useWindowDimensions, View} from 'react-native'

export function Component({
  uris,
  index,
  isZooming,
}: {
  uris: string[]
  index: number
  isZooming: boolean
}) {
  const winDim = useWindowDimensions()
  const left = index * winDim.width * -1
  return (
    <View style={[styles.container, {left}]}>
      {uris.map((uri, i) => (
        <Image
          key={i}
          style={[
            styles.image,
            {left: i * winDim.width},
            isZooming && i !== index ? {opacity: 0} : undefined,
          ]}
          source={{uri}}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  image: {
    position: 'absolute',
    top: 200,
    left: 0,
    resizeMode: 'contain',
    width: '100%',
    aspectRatio: 1,
  },
})
