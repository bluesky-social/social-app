import {useEffect,useState} from 'react'
import {Image} from 'react-native'

import type {Dimensions} from '#/lib/media/types'

type CacheStorageItem<T> = {key: string; value: T}
const createCache = <T>(cacheSize: number) => ({
  _storage: [] as CacheStorageItem<T>[],
  get(key: string) {
    const {value} =
      this._storage.find(({key: storageKey}) => storageKey === key) || {}
    return value
  },
  set(key: string, value: T) {
    if (this._storage.length >= cacheSize) {
      this._storage.shift()
    }
    this._storage.push({key, value})
  },
})

const sizes = createCache<Dimensions>(50)
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

export function useImageDimensions({
  src,
  knownDimensions,
}: {
  src: string
  knownDimensions: Dimensions | undefined
}) {
  const [dims, setDims] = useState(() => knownDimensions ?? get(src))
  const [prevSrc, setPrevSrc] = useState(src)
  if (src !== prevSrc) {
    setDims(knownDimensions ?? get(src))
    setPrevSrc(src)
  }

  useEffect(() => {
    let aborted = false
    if (dims !== undefined) return
    fetch(src).then(newDims => {
      if (aborted) return
      setDims(newDims)
    })
    return () => {
      aborted = true
    }
  }, [dims, setDims, src])

  return dims
}
