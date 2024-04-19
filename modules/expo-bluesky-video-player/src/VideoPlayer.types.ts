import {ViewProps} from 'react-native'

export interface VideoPlayerStateChangeEvent {
  nativeEvent: {
    isPlaying: boolean
    isLoaded: boolean
  }
}

export interface VideoPlayerViewProps extends ViewProps {
  autoplay?: boolean
  source?: string
  onPlayerStateChange?: (event: VideoPlayerStateChangeEvent) => void
}
