import React from 'react'
import {StyleSheet, View, ViewProps} from 'react-native'
import {addStyle} from 'lib/styles'

type BlurViewProps = ViewProps & {
  blurType?: 'dark' | 'light'
  blurAmount?: number
}

export const BlurView = ({
  style,
  blurType,
  ...props
}: React.PropsWithChildren<BlurViewProps>) => {
  if (blurType === 'dark') {
    style = addStyle(style, styles.dark)
  } else {
    style = addStyle(style, styles.light)
  }
  return <View style={style} {...props} />
}

const styles = StyleSheet.create({
  dark: {
    backgroundColor: '#0008',
  },
  light: {
    backgroundColor: '#fff8',
  },
})
