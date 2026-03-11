import {type EventSubscription, requireNativeModule} from 'expo-modules-core'

import {
  type CompressResult,
  type NativeCompressOptions,
  type VideoMetadata,
} from './types'

type ProgressEvent = {id: number; progress: number}

interface ExpoVideoCompressModule {
  probe(uri: string): Promise<VideoMetadata>
  compress(uri: string, options: NativeCompressOptions): Promise<CompressResult>
  cancel(): void
  addListener(
    eventName: 'onProgress',
    listener: (event: ProgressEvent) => void,
  ): EventSubscription
}

export default requireNativeModule<ExpoVideoCompressModule>('ExpoVideoCompress')
