import * as React from 'react'
import {StyleSheet} from 'react-native'

import {GifViewProps} from './GifView.types'

export class GifView extends React.PureComponent<GifViewProps> {
  private readonly videoPlayerRef: React.RefObject<HTMLMediaElement> =
    React.createRef()
  private isPlaying: boolean
  private isLoaded = false

  constructor(props: GifViewProps | Readonly<GifViewProps>) {
    super(props)
    this.isPlaying = props.autoplay ?? false
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
        isPlaying: this.isPlaying,
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
    this.videoPlayerRef.current.play()
    this.isPlaying = true
    this.firePlayerStateChangeEvent()
  }

  async pauseAsync(): Promise<void> {
    this.videoPlayerRef.current.pause()
    this.isPlaying = false
    this.firePlayerStateChangeEvent()
  }

  async toggleAsync(): Promise<void> {
    if (this.isPlaying) {
      await this.pauseAsync()
    } else {
      await this.playAsync()
    }
  }

  render() {
    return (
      <video
        src={this.props.webpSource}
        autoPlay={this.props.autoplay ? 'autoplay' : undefined}
        style={StyleSheet.flatten(this.props.style)}
        preload={this.props.autoplay ? 'auto' : undefined}
        onCanPlay={this.onLoad}
        loop="loop"
        muted="muted"
        ref={this.videoPlayerRef}
        playsInline={true}
      />
    )
  }
}
