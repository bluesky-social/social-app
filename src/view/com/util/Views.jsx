import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'

export const FlatList_INTERNAL = Animated.FlatList
export const ScrollView = Animated.ScrollView
export function CenteredView(props) {
  return <View {...props} />
}
