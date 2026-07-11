import type Hls from 'hls.js'

export function Controls(_props: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  hlsRef: React.RefObject<Hls | undefined | null>
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  fullscreenRef: React.RefObject<HTMLDivElement | null>
  hlsLoading: boolean
  hasSubtitleTrack: boolean
  isGif: boolean
  altText?: string
  updateCuePositions: (controlsVisible?: boolean) => void
}): never {
  throw new Error('VideoWebControls may not be used on native.')
}
