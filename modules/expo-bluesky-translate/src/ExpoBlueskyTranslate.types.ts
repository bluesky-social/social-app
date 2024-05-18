import React from 'react'

export type ExpoBlueskyTranslateProps = {
  text: string
  isPresented?: boolean
  children: React.ReactNode
  onClose?: () => void
  onReplacementAction?: (event: {nativeEvent: {text: string}}) => void
}
