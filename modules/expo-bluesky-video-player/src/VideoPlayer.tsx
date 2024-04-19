import React from 'react'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {VideoPlayerViewProps} from './VideoPlayer.types'

const VideoModule = requireNativeModule('ExpoBlueskyVideoPlayer')
const NativeView: React.ComponentType<
  VideoPlayerViewProps & {ref: React.RefObject<any>}
> = requireNativeViewManager('ExpoBlueskyVideoPlayer')

export class VideoPlayer extends React.PureComponent<VideoPlayerViewProps> {
  // TODO native types, should all be the same as those in this class
  private nativeRef: React.RefObject<any> = React.createRef()

  constructor(props: VideoPlayerViewProps | Readonly<VideoPlayerViewProps>) {
    super(props)
  }

  static async prefetchAsync(source: string): Promise<void> {
    await VideoModule.prefetchAsync(source)
  }

  async playAsync(): Promise<void> {
    await this.nativeRef.current.playAsync()
  }

  async pauseAsync(): Promise<void> {
    await this.nativeRef.current.pauseAsync()
  }

  async toggleAsync(): Promise<void> {
    await this.nativeRef.current.toggleAsync()
  }

  render() {
    return <NativeView {...this.props} ref={this.nativeRef} />
  }
}
