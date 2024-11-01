import {Image} from 'react-native'

import type {Dimensions} from '#/lib/media/types'

const sizes: Map<string, Dimensions> = new Map()
const activeRequests: Map<string, Promise<Dimensions>> = new Map()

export function get(uri: string): Dimensions | undefined {
  return sizes.get(uri)
}

export function fetch(uri: string): Promise<Dimensions> {
  const dims = sizes.get(uri)
  if (dims) {
    return Promise.resolve(dims)
  }
  const activeRequest = activeRequests.get(uri)
  if (activeRequest) {
    return activeRequest
  }
  const prom = new Promise<Dimensions>((resolve, reject) => {
    Image.getSize(
      uri,
      (width: number, height: number) => {
        const size = {width, height}
        sizes.set(uri, size)
        resolve(size)
      },
      (err: any) => {
        console.error('Failed to fetch image dimensions for', uri, err)
        reject(new Error('Could not fetch dimensions'))
      },
    )
  }).finally(() => {
    activeRequests.delete(uri)
  })
  activeRequests.set(uri, prom)
  return prom
}
