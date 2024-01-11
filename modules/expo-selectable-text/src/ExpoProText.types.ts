import React from 'react'
import { ColorValue } from 'react-native'

interface ExpoProTextViewCommonProps {
  selectable?: boolean
}

export interface ExpoProTextViewProps extends ExpoProTextViewCommonProps {
  children: React.ReactNode
  style?: ExpoProTextStyle
  onPress?: () => void
  onLongPress?: () => void
}

export interface ExpoProTextNativeViewProps extends ExpoProTextViewCommonProps {
  segments: string
  textStyle?: ExpoProTextStyle
  onTextPress?: (event: ExpoProTextPressEvent) => void
  onTextLongPress?: (event: ExpoProTextPressEvent) => void
  onTextLayout?: (event: ExpoProTextLayoutEvent) => void
  disableLongPress: boolean
}

interface ExpoProTextStyle {
  color: ColorValue
  fontSize?: number
  fontStyle?: 'normal' | 'italic'
  fontWeight?: 'normal' | 'bold'
  letterSpacing?: number
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify'
  lineHeight?: number
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
  style?: ExpoProTextStyle
  handlePress?: boolean
  handleLongPress?: boolean
}
