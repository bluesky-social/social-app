import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'

import {useGate} from 'lib/statsig/statsig'

export const FlatList_INTERNAL = Animated.FlatList
export function CenteredView(props) {
  return <View {...props} />
}

export function ScrollView(props) {
  const gate = useGate()
  return (
    <Animated.ScrollView
      {...props}
      showsVerticalScrollIndicator={!gate('hide_vertical_scroll_indicators')}
    />
  )
}
