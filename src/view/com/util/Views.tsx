import React from 'react'
import {View, ViewProps} from 'react-native'
export {FlatList, ScrollView} from 'react-native'

export function CenteredView(
  props: React.PropsWithChildren<ViewProps & {sideBorders?: boolean}>,
) {
  return <View {...props} />
}
