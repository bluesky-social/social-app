import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {isIOS} from 'platform/detection'

const FlatListIOSHack = React.forwardRef(function FlatListIOSHack(props, ref) {
  let newProps = props
  if (props.style?.paddingTop) {
    if (props.contentInset) {
      throw Error('Do not pass contentInset directly')
    }
    newProps = {
      ...props,
      contentInset: {
        top: props.style.paddingTop,
      },
      style: {
        ...props.style,
        paddingTop: undefined,
      },
    }
  }
  return <Animated.FlatList ref={ref} {...newProps} />
})

export const FlatList = isIOS ? FlatListIOSHack : Animated.FlatList

export const ScrollView = Animated.ScrollView
export function CenteredView(props) {
  return <View {...props} />
}
