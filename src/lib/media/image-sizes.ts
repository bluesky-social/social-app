import {Image} from 'react-native'
import type {Dimensions} from 'lib/media/types'

const sizes: Map<string, Dimensions> = new Map()
const activeRequests: Map<string, Promise<Dimensions>> = new Map()

export function get(uri: string): Dimensions | undefined {
  return sizes.get(uri)
}

export async function fetch(uri: string): Promise<Dimensions> {
  const Dimensions = sizes.get(uri)
  if (Dimensions) {
    return Dimensions
  }

  const prom =
    activeRequests.get(uri) ||
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
  activeRequests.set(uri, prom)
  const res = await prom
  activeRequests.delete(uri)
  sizes.set(uri, res)
  return res
}
