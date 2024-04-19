import * as React from 'react'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  private readonly videoPlayerRef: React.RefObject<HTMLMediaElement> =
    React.createRef()
  private isLoaded: boolean = false

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
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
    this.isLoaded = true
    this.firePlayerStateChangeEvent({
      isLoaded: true,
      isPlaying: this.videoPlayerRef.current.paused,
    })
  }

  async playAsync(): Promise<void> {
    this.videoPlayerRef.current.play()
    this.firePlayerStateChangeEvent({
      isLoaded: this.isLoaded,
      isPlaying: true,
    })
  }

  async pauseAsync(): Promise<void> {
    this.videoPlayerRef.current.pause()
    this.firePlayerStateChangeEvent({
      isLoaded: this.isLoaded,
      isPlaying: true,
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
