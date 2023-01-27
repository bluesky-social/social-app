import React from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'

type OnPress = ((event: GestureResponderEvent) => void) | undefined
export const FAB = (_opts: {icon: IconProp; onPress: OnPress}) => {
  return <View />
}
