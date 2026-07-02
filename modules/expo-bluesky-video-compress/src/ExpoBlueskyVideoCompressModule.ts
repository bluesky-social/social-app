import {type EventSubscription, requireNativeModule} from 'expo-modules-core'

import {
  type CompressResult,
  type NativeCompressOptions,
  type VideoMetadata,
} from './types'

type ProgressEvent = {id: number; progress: number}

interface ExpoBlueskyVideoCompressModule {
  probe(uri: string): Promise<VideoMetadata>
  compress(uri: string, options: NativeCompressOptions): Promise<CompressResult>
  cancel(jobId: number): void
  addListener(
    eventName: 'onProgress',
    listener: (event: ProgressEvent) => void,
  ): EventSubscription
}

export default requireNativeModule<ExpoBlueskyVideoCompressModule>(
  'ExpoBlueskyVideoCompress',
)
