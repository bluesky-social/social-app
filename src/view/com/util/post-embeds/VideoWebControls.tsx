import React from 'react'

export function Controls({}: {
  videoRef: React.RefObject<HTMLVideoElement>
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  enterFullscreen: () => void
}): React.ReactElement {
  throw new Error('Web-only component')
}
