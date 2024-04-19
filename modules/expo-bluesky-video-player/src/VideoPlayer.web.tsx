import * as React from 'react'
import {Pressable} from 'react-native'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  private readonly videoPlayerRef: React.RefObject<HTMLMediaElement> =
    React.createRef()

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
  }

  static async prefetchAsync(_: string): Promise<void> {
    console.warn('prefetchAsync is not supported on web')
  }

  private firePlayerStateChangeEvent = (isPlaying: boolean) => {
    this.props.onPlayerStateChange?.({
      nativeEvent: {
        isPlaying,
      },
    })
  }

  async playAsync(): Promise<void> {
    await this.videoPlayerRef.current.play()
    this.firePlayerStateChangeEvent(true)
  }

  async pauseAsync(): Promise<void> {
    await this.videoPlayerRef.current.pause()
    this.firePlayerStateChangeEvent(false)
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
      <Pressable accessibilityRole="button">
        <video
          src={this.props.source}
          autoPlay={this.props.autoplay ? 'autoplay' : undefined}
          style={this.props.style}
          preload={this.props.autoplay ? 'auto' : undefined}
          loop="loop"
          muted="muted"
          ref={this.videoPlayerRef}
        />
      </Pressable>
    )
  }
}
