import React from 'react'
import {TextProps, TextStyle, ViewStyle} from 'react-native'

export interface ExpoUITextViewProps extends TextProps {}

export interface ExpoUITextViewNativeProps extends TextProps {
  children: React.ReactNode
  style: ViewStyle[]
}

export interface ExpoUITextViewChildNativeProps extends ExpoUITextViewProps {
  text: string
  textStyle: TextStyle
  onTextPress?: (...args: any[]) => void
  onTextLongPress?: (...args: any[]) => void
}
