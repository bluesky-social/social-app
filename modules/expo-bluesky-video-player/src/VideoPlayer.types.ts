import {ViewProps} from 'react-native'

export interface VideoPlayerStateChangeEvent {
  isPlaying: boolean
}

export interface VideoPlayerViewProps extends ViewProps {
  autoplay?: boolean
  source?: string
  onPlayerStateChange?: (event: VideoPlayerStateChangeEvent) => void
}
