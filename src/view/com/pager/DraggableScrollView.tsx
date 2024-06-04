import {useDraggableScroll} from 'lib/hooks/useDraggableScrollView'
import React from 'react'
import {ScrollView} from 'react-native'

export const DraggableScrollView = React.forwardRef<
  ScrollView,
  React.ComponentProps<typeof ScrollView>
>(function DraggableScrollView(props, ref) {
  const {refs} = useDraggableScroll<ScrollView>({
    outerRef: ref,
    cursor: 'grab', // optional, default
  })

  return <ScrollView ref={refs} horizontal {...props} />
})
