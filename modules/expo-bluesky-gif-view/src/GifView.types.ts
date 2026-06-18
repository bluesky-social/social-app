import {type ViewProps} from 'react-native'

export interface GifViewStateChangeEvent {
  nativeEvent: {
    isPlaying: boolean
    isLoaded: boolean
  }
}

export interface GifViewProps extends ViewProps {
  autoplay?: boolean
  source?: string
  /**
   * Web-only ordered list of `<source>` tags rendered inside `<video>`. The
   * browser uses `canPlayType` to pick the first one it supports. Ignored on
   * native (which uses `source` directly).
   */
  sources?: ReadonlyArray<{src: string; type: string}>
  placeholderSource?: string
  onPlayerStateChange?: (event: GifViewStateChangeEvent) => void
}
