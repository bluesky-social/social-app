import {type ComponentPropsWithRef} from 'react'
import {ScrollView} from 'react-native'

export function DraggableScrollView(
  props: ComponentPropsWithRef<typeof ScrollView>,
) {
  return <ScrollView horizontal {...props} />
}
