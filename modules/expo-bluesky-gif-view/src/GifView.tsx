import {createRef, PureComponent} from 'react'
import {requireNativeModule} from 'expo'
import {requireNativeViewManager} from 'expo-modules-core'

import {type GifViewProps} from './GifView.types'

interface GifViewNativeRef {
  playAsync: () => Promise<void>
  pauseAsync: () => Promise<void>
  toggleAsync: () => Promise<void>
}

const NativeModule: {
  prefetchAsync: (sources: string[]) => Promise<void>
} = requireNativeModule('ExpoBlueskyGifView')
const NativeView: React.ComponentType<
  GifViewProps & {ref: React.RefObject<GifViewNativeRef | null>}
> = requireNativeViewManager('ExpoBlueskyGifView')

export class GifView extends PureComponent<GifViewProps> {
  private nativeRef: React.RefObject<GifViewNativeRef | null> = createRef()

  constructor(props: GifViewProps | Readonly<GifViewProps>) {
    super(props)
  }

  static async prefetchAsync(sources: string[]): Promise<void> {
    return await NativeModule.prefetchAsync(sources)
  }

  async playAsync(): Promise<void> {
    await this.nativeRef.current?.playAsync()
  }

  async pauseAsync(): Promise<void> {
    await this.nativeRef.current?.pauseAsync()
  }

  async toggleAsync(): Promise<void> {
    await this.nativeRef.current?.toggleAsync()
  }

  render() {
    return <NativeView {...this.props} ref={this.nativeRef} />
  }
}
