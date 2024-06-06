import {PropsWithChildren} from 'react'
import {ViewProps} from 'react-native'
export {FlatList as FlatList_INTERNAL, ScrollView} from 'react-native'
export function CenteredView({
  style,
  sideBorders,
  ...props
}: PropsWithChildren<
  ViewProps & {
    /**
     * @platform web
     */
    sideBorders?: boolean
    /**
     * @platform web
     */
    topBorder?: boolean
  }
>)
