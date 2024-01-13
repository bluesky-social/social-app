import React from 'react'
import {ColorValue, TextStyle, ViewStyle} from 'react-native'

interface ExpoProTextViewCommonProps {
  selectable?: boolean
}

export interface ExpoProTextViewProps extends ExpoProTextViewCommonProps {
  children: React.ReactNode
  style?: TextStyle
  onPress?: () => void
  onLongPress?: () => void
}

export interface ExpoProTextNativeViewProps extends ExpoProTextViewCommonProps {
  segments: string
  textStyle?: TextStyle
  onTextPress?: (event: ExpoProTextPressEvent) => void
  onTextLongPress?: (event: ExpoProTextPressEvent) => void
  onTextLayout?: (event: ExpoProTextLayoutEvent) => void
  disableLongPress: boolean
  style: ViewStyle
  rootStyle?: string
}

export interface ExpoProTextLayoutEvent {
  nativeEvent: {
    height: number
  }
}

export interface ExpoProTextPressEvent {
  nativeEvent: {
    index: number
  }
}

export interface ExpoProTextSegment {
  index: number
  text: string
  style?: TextStyle
  handlePress?: boolean
  handleLongPress?: boolean
}
