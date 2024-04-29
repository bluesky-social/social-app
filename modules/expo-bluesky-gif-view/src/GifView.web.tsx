import * as React from 'react'
import {StyleSheet} from 'react-native'

import {GifViewProps} from './GifView.types'

export class GifView extends React.PureComponent<GifViewProps> {
  private readonly videoPlayerRef: React.RefObject<HTMLMediaElement> =
    React.createRef()
  private isLoaded = false

  constructor(props: GifViewProps | Readonly<GifViewProps>) {
    super(props)
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

  static async prefetchAsync(_: string[]): Promise<void> {
    console.warn('prefetchAsync is not supported on web')
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
    this.videoPlayerRef.current?.play()
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
    return (
      <video
        src={this.props.source}
        autoPlay={this.props.autoplay ? 'autoplay' : undefined}
        preload={this.props.autoplay ? 'auto' : undefined}
        playsInline={true}
        loop="loop"
        muted="muted"
        style={StyleSheet.flatten(this.props.style)}
        onCanPlay={this.onLoad}
        onPlay={this.firePlayerStateChangeEvent}
        onPause={this.firePlayerStateChangeEvent}
        aria-label={this.props.accessibilityLabel}
        ref={this.videoPlayerRef}
      />
    )
  }
}
