import {Image} from 'react-native'
import type {Dimensions} from 'lib/media/types'

export class ImageSizesCache {
  sizes: Map<string, Dimensions> = new Map()
  activeRequests: Map<string, Promise<Dimensions>> = new Map()

  constructor() {}

  get(uri: string): Dimensions | undefined {
    return this.sizes.get(uri)
  }

  async fetch(uri: string): Promise<Dimensions> {
    const Dimensions = this.sizes.get(uri)
    if (Dimensions) {
      return Dimensions
    }

    const prom =
      this.activeRequests.get(uri) ||
      new Promise<Dimensions>(resolve => {
        Image.getSize(
          uri,
          (width: number, height: number) => resolve({width, height}),
          (err: any) => {
            console.error('Failed to fetch image dimensions for', uri, err)
            resolve({width: 0, height: 0})
          },
        )
      })
    this.activeRequests.set(uri, prom)
    const res = await prom
    this.activeRequests.delete(uri)
    this.sizes.set(uri, res)
    return res
  }
}
