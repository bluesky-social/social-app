import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {useStores} from 'state/index'

interface Props<Options extends string> {
  selection: Options
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export function StackedView<Options extends string>({
  selection,
  style,
  children,
}: Props<Options>) {
  const store = useStores()

  return (
    <View style={[styles.root, style]}>
      {React.Children.map(children, child => {
        const key = (child as any)?.key
        if (!key) {
          store.log.warn('Stacked view children need a key')
          return <></>
        }
        const isHidden = key !== selection
        return (
          <View key={key} style={[styles.child, isHidden && styles.hidden]}>
            {child}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  child: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
})
