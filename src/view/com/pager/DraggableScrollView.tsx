import {useDraggableScroll} from 'lib/hooks/useDraggableScrollView'
import React, {ComponentProps} from 'react'
import {ScrollView} from 'react-native'

export const DraggableScrollView = React.forwardRef<
  ScrollView,
  ComponentProps<typeof ScrollView>
>(function DraggableScrollView(props, ref) {
  const {refs} = useDraggableScroll<ScrollView>({
    outerRef: ref,
    cursor: 'grab', // optional, default
  })

  return <ScrollView ref={refs} horizontal {...props} />
})
