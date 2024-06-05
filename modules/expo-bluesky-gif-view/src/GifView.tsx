import {ComponentType, createRef, PureComponent, RefObject} from 'react'
import {requireNativeModule} from 'expo'
import {requireNativeViewManager} from 'expo-modules-core'

import {GifViewProps} from './GifView.types'

const NativeModule = requireNativeModule('ExpoBlueskyGifView')
const NativeView: ComponentType<GifViewProps & {ref: RefObject<any>}> =
  requireNativeViewManager('ExpoBlueskyGifView')

export class GifView extends PureComponent<GifViewProps> {
  // TODO native types, should all be the same as those in this class
  private nativeRef: RefObject<any> = createRef()

  constructor(props: GifViewProps | Readonly<GifViewProps>) {
    super(props)
  }

  static async prefetchAsync(sources: string[]): Promise<void> {
    return await NativeModule.prefetchAsync(sources)
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
