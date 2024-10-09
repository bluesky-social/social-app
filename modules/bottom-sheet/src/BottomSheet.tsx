import React from 'react'

import {BottomSheetViewProps} from './BottomSheet.types'
import {BottomSheetNativeComponent} from './BottomSheetNativeComponent'
import {useBottomSheetPortal} from './BottomSheetPortal'

export function BottomSheet(props: BottomSheetViewProps) {
  const Portal = useBottomSheetPortal()
  return (
    <Portal>
      <BottomSheetNativeComponent {...props} />
    </Portal>
  )
}
