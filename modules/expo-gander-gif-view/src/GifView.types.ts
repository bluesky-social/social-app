import {ViewProps} from 'react-native'

export interface GifViewStateChangeEvent {
  nativeEvent: {
    isPlaying: boolean
    isLoaded: boolean
  }
}

export interface GifViewProps extends ViewProps {
  autoplay?: boolean
  source?: string
  placeholderSource?: string
  onPlayerStateChange?: (event: GifViewStateChangeEvent) => void
}
