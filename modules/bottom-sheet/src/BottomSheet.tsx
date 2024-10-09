import React from 'react'

import {BottomSheetViewProps} from './BottomSheet.types'
import {BottomSheetNativeComponent} from './BottomSheetNativeComponent'
import {useBottomSheetPortal} from './BottomSheetPortal'

export const BottomSheet = React.forwardRef<
  BottomSheetNativeComponent,
  BottomSheetViewProps
>(function BottomSheet(props, ref) {
  const Portal = useBottomSheetPortal()
  return (
    <Portal>
      <BottomSheetNativeComponent {...props} ref={ref} />
    </Portal>
  )
})
