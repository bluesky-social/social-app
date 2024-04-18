import React, {createRef} from 'react'
import {requireNativeModule} from 'expo-modules-core'

import NativeVideoPlayer from './NativeVideoPlayer'
import {VideoPlayerViewProps} from './VideoPlayer.types'

const VideoModule = requireNativeModule('ExpoBlueskyVideoPlayer')

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  nativeRef: React.RefObject<any>

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
    this.nativeRef = createRef()
  }

  static async setShouldAutoplayAsync(shouldAutoplay: boolean): Promise<void> {
    await VideoModule.setShouldAutoplayAsync(shouldAutoplay)
  }

  async playAsync(): Promise<void> {
    await this.nativeRef.current.playAsync()
  }

  async pauseAsync(): Promise<void> {
    await this.nativeRef.current.pauseAsync()
  }

  render() {
    return <NativeVideoPlayer {...this.props} ref={this.nativeRef} />
  }
}
