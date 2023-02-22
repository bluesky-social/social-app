import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import Image from 'view/com/util/images/Image'

export function ImageHorzList({
  uris,
  onPress,
  style,
}: {
  uris: string[]
  onPress?: (index: number) => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.flexRow, style]}>
      {uris.map((uri, i) => (
        <TouchableWithoutFeedback key={i} onPress={() => onPress?.(i)}>
          <Image source={{uri}} style={styles.image} />
        </TouchableWithoutFeedback>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row'},
  image: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginRight: 5,
  },
})
