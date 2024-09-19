import React from 'react'

import {DialogControlProps} from '#/components/Dialog/types'

export function useAutoOpen(control: DialogControlProps, showTimeout?: number) {
  React.useEffect(() => {
    if (showTimeout) {
      const timeout = setTimeout(() => {
        control.open()
      }, showTimeout)
      return () => {
        clearTimeout(timeout)
      }
    } else {
      control.open()
    }
  }, [control, showTimeout])
}
