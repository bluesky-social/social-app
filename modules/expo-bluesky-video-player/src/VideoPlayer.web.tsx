import * as React from 'react'
import {Pressable} from 'react-native'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  videoPlayerRef: React.RefObject<HTMLMediaElement>

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
    this.videoPlayerRef = React.createRef()
  }

  static async prefetchAsync(_: string): Promise<void> {
    console.warn('prefetchAsync is not supported on web')
  }

  async playAsync(): Promise<void> {
    await this.videoPlayerRef.current.play()
  }

  async pauseAsync(): Promise<void> {
    await this.videoPlayerRef.current.pause()
  }

  async toggleAsync(): Promise<void> {
    if (this.videoPlayerRef.current.paused) {
      await this.videoPlayerRef.current.play()
    } else {
      await this.videoPlayerRef.current.pause()
    }
  }

  onPress = () => {
    if (this.videoPlayerRef.current.paused) {
      this.videoPlayerRef.current.play()
    } else {
      this.videoPlayerRef.current.pause()
    }

    this.props.onPlayerStateChange?.({
      isPlaying: !this.videoPlayerRef.current?.paused,
    })
  }

  render() {
    return (
      <Pressable accessibilityRole="button" onPress={this.onPress}>
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
