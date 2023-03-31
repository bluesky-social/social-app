import {Image} from 'react-native'
import {Dim} from 'lib/media/manip'

export class ImageSizesCache {
  sizes: Map<string, Dim> = new Map()
  activeRequests: Map<string, Promise<Dim>> = new Map()

  constructor() {}

  get(uri: string): Dim | undefined {
    return this.sizes.get(uri)
  }

  async fetch(uri: string): Promise<Dim> {
    const dim = this.sizes.get(uri)
    if (dim) {
      return dim
    }
    const prom =
      this.activeRequests.get(uri) ||
      new Promise<Dim>(resolve => {
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
