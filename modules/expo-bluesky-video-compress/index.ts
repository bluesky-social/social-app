import {type EventSubscription} from 'expo-modules-core'

import NativeModule from './src/ExpoVideoCompressModule'
import {
  type CompressOptions,
  type CompressResult,
  type VideoMetadata,
} from './src/types'

export type {CompressOptions, CompressResult, VideoMetadata}

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
  options: CompressOptions,
  callbacks?: {
    onProgress?: (progress: number) => void
    signal?: AbortSignal
  },
): Promise<CompressResult> {
  const jobId = ++jobIdCounter
  let subscription: EventSubscription | undefined

  if (callbacks?.signal?.aborted) {
    return Promise.reject(new AbortError())
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
      NativeModule.cancel()
      subscription?.remove()
      reject(new AbortError())
    }

    if (callbacks?.signal) {
      callbacks.signal.addEventListener('abort', abortHandler, {once: true})
    }

    NativeModule.compress(uri, {...options, jobId})
      .then(result => {
        callbacks?.signal?.removeEventListener('abort', abortHandler)
        subscription?.remove()
        resolve(result)
      })
      .catch(error => {
        callbacks?.signal?.removeEventListener('abort', abortHandler)
        subscription?.remove()
        reject(error)
      })
  })
}
