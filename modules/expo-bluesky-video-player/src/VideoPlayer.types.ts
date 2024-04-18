import {ViewProps} from 'react-native'

export interface VideoPlayerLoadEvent {
  height: number
  width: number
  duration: number
}

export interface VideoPlayerViewProps extends ViewProps {
  source: string | null
  onLoad: (event: VideoPlayerLoadEvent) => void
}
