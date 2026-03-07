import {useEffect, useRef} from 'react'

import {logger} from '#/logger'
import {useDialogStateControlContext} from '#/state/dialogs'
import {type DialogControlProps} from '#/components/Dialog/types'

export function useDialogCallbackQueue(
  control: DialogControlProps,
  onClose?: () => void,
) {
  const closeCallbacks = useRef<(() => void)[]>([])
  const {setDialogIsOpen, setFullyExpandedCount} =
    useDialogStateControlContext()

  const callQueuedCallbacks = () => {
    for (const cb of closeCallbacks.current) {
      try {
        cb()
      } catch (e: any) {
        logger.error(e || 'Error running close callback')
      }
    }
    closeCallbacks.current = []
  }

  const enqueueCallback = (cb?: () => void) => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb)
    }
  }

  const handleOpen = () => {
    callQueuedCallbacks()
    setDialogIsOpen(control.id, true)
  }

  const handleClose = () => {
    setDialogIsOpen(control.id, false)
    callQueuedCallbacks()
    onClose?.()
  }

  return {
    enqueueCallback,
    handleOpen,
    handleClose,
    setFullyExpandedCount,
  }
}

export function useAutoOpen(control: DialogControlProps, showTimeout?: number) {
  useEffect(() => {
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
