import {type EventSubscription} from 'expo-modules-core'

import NativeModule from './src/ExpoBlueskyVideoCompressModule'
import {
  type CodecPreference,
  type CompressCallbacks,
  type CompressOptions,
  type CompressResult,
  type VideoMetadata,
} from './src/types'

export type {
  CodecPreference,
  CompressCallbacks,
  CompressOptions,
  CompressResult,
  VideoMetadata,
}

class AbortError extends Error {
  name = 'AbortError'
  constructor() {
    super('Aborted')
  }
}

let jobIdCounter = 0

export function probe(uri: string): Promise<VideoMetadata> {
  return NativeModule.probe(uri)
}

export function compress(
  uri: string,
  options: CompressOptions = {},
  callbacks?: CompressCallbacks,
): Promise<CompressResult> {
  const jobId = ++jobIdCounter
  let subscription: EventSubscription | undefined

  if (callbacks?.signal?.aborted) {
    return Promise.reject(new AbortError())
  }

  const nativeOptions = {
    targetBitrate: options.targetBitrate ?? 0,
    maxSize: options.maxSize ?? 1920,
    codec: options.codec ?? 'auto',
    frameRateCap: options.frameRateCap ?? 30,
    jobId,
  }

  return new Promise<CompressResult>((resolve, reject) => {
    if (callbacks?.onProgress) {
      subscription = NativeModule.addListener(
        'onProgress',
        (event: {id: number; progress: number}) => {
          if (event.id === jobId) {
            callbacks.onProgress!(event.progress)
          }
        },
      )
    }

    const abortHandler = () => {
      NativeModule.cancel(jobId)
      subscription?.remove()
      reject(new AbortError())
    }

    if (callbacks?.signal) {
      callbacks.signal.addEventListener('abort', abortHandler, {once: true})
    }

    NativeModule.compress(uri, nativeOptions)
      .then(result => {
        callbacks?.signal?.removeEventListener('abort', abortHandler)
        subscription?.remove()
        resolve(result)
      })
      .catch((error: unknown) => {
        callbacks?.signal?.removeEventListener('abort', abortHandler)
        subscription?.remove()
        reject(error instanceof Error ? error : new Error(String(error)))
      })
  })
}
