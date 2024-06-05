import {ComponentProps, forwardRef} from 'react'
import {ScrollView} from 'react-native'

import {useDraggableScroll} from 'lib/hooks/useDraggableScrollView'

export const DraggableScrollView = forwardRef<
  ScrollView,
  ComponentProps<typeof ScrollView>
>(function DraggableScrollView(props, ref) {
  const {refs} = useDraggableScroll<ScrollView>({
    outerRef: ref,
    cursor: 'grab', // optional, default
  })

  return <ScrollView ref={refs} horizontal {...props} />
})
