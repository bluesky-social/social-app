import React from 'react'
import {ViewProps} from 'react-native'
export {FlatList as FlatList_INTERNAL, ScrollView} from 'react-native'
export function CenteredView({
  style,
  sideBorders,
  ...props
}: React.PropsWithChildren<ViewProps & {sideBorders?: boolean}>)
