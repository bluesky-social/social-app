import {ViewProps} from 'react-native'

export interface VideoPlayerLoadEvent {
  height: number
  width: number
  duration: number
}

export interface VideoPlayerViewProps extends ViewProps {
  autoplay?: boolean
  source?: string
  onLoad?: (event: VideoPlayerLoadEvent) => void
}
