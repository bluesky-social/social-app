import React from 'react'
import type Hls from 'hls.js'

export function Controls({}: {
  videoRef: React.RefObject<HTMLVideoElement>
  hls: Hls
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  enterFullscreen: () => void
  hasSubtitleTrack: boolean
}): React.ReactElement {
  throw new Error('Web-only component')
}
