import React from 'react'
import {View} from 'react-native'

export function ActionsWrapper({
  isFromSelf,
  onOpenMenu,
  children,
}: {
  isFromSelf: boolean
  onOpenMenu: () => unknown
  children: React.ReactNode
}) {
  return <View>{children}</View>
}
