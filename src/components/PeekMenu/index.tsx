import {type ReactNode} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'

import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'
import {type PreviewContent} from '../../../modules/expo-bluesky-context-menu'

export type {
  MenuItemSpec,
  PreviewContent,
} from '../../../modules/expo-bluesky-context-menu'

export function Root({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={style}>{children}</View>
}

export function Trigger({
  children,
}: {
  preview?: PreviewContent
  onPreviewPress?: () => void
  borderRadius?: number
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  return <>{children}</>
}

export function Menu(_: {children: ReactNode}): null {
  return null
}

export function MenuItem(_: {
  id: string
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
  children: ReactNode
}): null {
  return null
}

export function MenuItemIcon(_: {icon: IconWithSvgMeta}): null {
  return null
}

export function MenuItemText(_: {children: string}): null {
  return null
}
