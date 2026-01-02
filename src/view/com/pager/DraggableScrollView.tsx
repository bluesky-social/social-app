import {type ComponentPropsWithRef} from 'react'
import {ScrollView} from 'react-native'

import {useDraggableScroll} from '#/lib/hooks/useDraggableScrollView'
import {atoms as a, web} from '#/alf'

export function DraggableScrollView({
  ref,
  style,
  ...props
}: ComponentPropsWithRef<typeof ScrollView>) {
  const {refs} = useDraggableScroll<ScrollView>({
    outerRef: ref,
    cursor: 'grab', // optional, default
  })

  return (
    <ScrollView
      ref={refs}
      style={[style, web(a.user_select_none)]}
      horizontal
      {...props}
    />
  )
}
