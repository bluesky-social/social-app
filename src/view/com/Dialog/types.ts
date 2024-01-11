import React from 'react'
import type {ViewStyle} from 'react-native'

export type DialogContextProps = {
  close: () => void
}

export type DialogControlProps = {
  open: (index?: number) => void
  close: () => void
}

export type DialogOuterProps = {
  control: React.RefObject<DialogControlProps>
  onClose?: () => void
}

export type DialogInnerProps = React.PropsWithChildren<{style?: ViewStyle}>
