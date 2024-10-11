import React from 'react'

import {BottomSheetViewProps} from './BottomSheet.types'
import {BottomSheetNativeComponent} from './BottomSheetNativeComponent'
import {useBottomSheetPortal_INTERNAL} from './BottomSheetPortal'

export const BottomSheet = React.forwardRef<
  BottomSheetNativeComponent,
  BottomSheetViewProps
>(function BottomSheet(props, ref) {
  const Portal = useBottomSheetPortal_INTERNAL()

  if (!Portal) {
    throw new Error(
      'BottomSheet: You need to wrap your component tree with a <BottomSheetPortalProvider> to use the bottom sheet.',
    )
  }

  return (
    <Portal>
      <BottomSheetNativeComponent {...props} ref={ref} />
    </Portal>
  )
})
