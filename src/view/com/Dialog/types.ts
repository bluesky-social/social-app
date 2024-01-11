import React from 'react'

export type DialogControl = {
  open: (index?: number) => void
  close: () => void
}

export type DialogProps = {
  control: React.RefObject<DialogControl>
  onClose?: () => void
}
