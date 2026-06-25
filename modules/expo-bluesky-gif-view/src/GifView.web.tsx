import {createRef, PureComponent, type RefObject} from 'react'
import {StyleSheet} from 'react-native'

import {type GifViewProps} from './GifView.types'

export class GifView extends PureComponent<GifViewProps> {
  private readonly videoPlayerRef: RefObject<HTMLMediaElement> = createRef()
  private isLoaded = false

  constructor(props: GifViewProps | Readonly<GifViewProps>) {
    super(props)
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  componentDidUpdate(prevProps: Readonly<GifViewProps>) {
    if (prevProps.autoplay !== this.props.autoplay) {
      if (this.props.autoplay) {
        this.playAsync()
      } else {
        this.pauseAsync()
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  static async prefetchAsync(_: string[]): Promise<void> {
    console.warn('prefetchAsync is not supported on web')
  }

  // Safari pauses backgrounded `<video>` elements when the tab becomes
  // inactive and does not resume them automatically when the tab is shown
  // again, leaving GIFs frozen on a still frame. Resume playback when the
  // page becomes visible if the consumer expects autoplay.
  private onVisibilityChange = () => {
    if (
      document.visibilityState === 'visible' &&
      this.props.autoplay &&
      this.videoPlayerRef.current?.paused
    ) {
      void this.playAsync()
    }
  }

  private firePlayerStateChangeEvent = () => {
    this.props.onPlayerStateChange?.({
      nativeEvent: {
        isPlaying: !this.videoPlayerRef.current?.paused,
        isLoaded: this.isLoaded,
      },
    })
  }

  private onLoad = () => {
    // Prevent multiple calls to onLoad because onCanPlay will fire after each loop
    if (this.isLoaded) {
      return
    }

    this.isLoaded = true
    this.firePlayerStateChangeEvent()
  }

  async playAsync(): Promise<void> {
    try {
      await this.videoPlayerRef.current?.play()
    } catch (err) {
      // `play()` rejects with a NotAllowedError when the browser blocks
      // playback (e.g. Safari low-power mode or autoplay policy). This is
      // expected and benign - the GIF simply stays paused - so swallow it
      // rather than letting it surface as an unhandled rejection.
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return
      }
      throw err
    }
  }

  async pauseAsync(): Promise<void> {
    this.videoPlayerRef.current?.pause()
  }

  async toggleAsync(): Promise<void> {
    if (this.videoPlayerRef.current?.paused) {
      await this.playAsync()
    } else {
      await this.pauseAsync()
    }
  }

  render() {
    const {sources, source, autoplay, accessibilityLabel, style} = this.props
    const useSources = sources && sources.length > 0

    return (
      <video
        // When `<source>` children are present, omit `src` so the browser
        // walks the source list and picks via canPlayType.
        src={useSources ? undefined : source}
        autoPlay={autoplay ? 'autoplay' : undefined}
        preload={autoplay ? 'auto' : undefined}
        playsInline={true}
        loop="loop"
        muted="muted"
        style={StyleSheet.flatten(style)}
        onCanPlay={this.onLoad}
        onPlay={this.firePlayerStateChangeEvent}
        onPause={this.firePlayerStateChangeEvent}
        aria-label={accessibilityLabel}
        ref={this.videoPlayerRef}>
        {useSources
          ? sources.map(s => <source key={s.src} src={s.src} type={s.type} />)
          : null}
      </video>
    )
  }
}
