import * as React from 'react'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  private readonly videoPlayerRef: React.RefObject<HTMLMediaElement> =
    React.createRef()
  private isLoaded: boolean = false
  private isPlaying: boolean

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
    this.isPlaying = props.autoplay ?? false
  }

  componentDidUpdate(prevProps: Readonly<VideoPlayerViewProps>) {
    if (prevProps.autoplay !== this.props.autoplay) {
      if (this.props.autoplay) {
        this.playAsync()
      } else {
        this.pauseAsync()
      }
    }
  }

  static async prefetchAsync(_: string): Promise<void> {
    console.warn('prefetchAsync is not supported on web')
  }

  private firePlayerStateChangeEvent = (e: {
    isPlaying: boolean
    isLoaded: boolean
  }) => {
    this.props.onPlayerStateChange?.({
      nativeEvent: e,
    })
  }

  private onLoad = () => {
    // Prevent multiple calls to onLoad because onCanPlay will fire after each loop
    if (this.isLoaded) {
      return
    }

    this.isLoaded = true
    this.firePlayerStateChangeEvent({
      isLoaded: true,
      isPlaying: this.isPlaying,
    })
  }

  async playAsync(): Promise<void> {
    this.videoPlayerRef.current.play()
    this.isPlaying = true
    this.firePlayerStateChangeEvent({
      isLoaded: this.isLoaded,
      isPlaying: true,
    })
  }

  async pauseAsync(): Promise<void> {
    this.videoPlayerRef.current.pause()
    this.isPlaying = true
    this.firePlayerStateChangeEvent({
      isLoaded: this.isLoaded,
      isPlaying: false,
    })
  }

  async toggleAsync(): Promise<void> {
    if (this.videoPlayerRef.current.paused) {
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
        style={this.props.style}
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
