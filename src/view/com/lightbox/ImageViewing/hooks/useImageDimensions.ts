/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useEffect, useState} from 'react'
import {Image, ImageURISource} from 'react-native'

import {Dimensions, ImageSource} from '../@types'

const CACHE_SIZE = 50

type CacheStorageItem = {key: string; value: any}

const createCache = (cacheSize: number) => ({
  _storage: [] as CacheStorageItem[],
  get(key: string): any {
    const {value} =
      this._storage.find(({key: storageKey}) => storageKey === key) || {}

    return value
  },
  set(key: string, value: any) {
    if (this._storage.length >= cacheSize) {
      this._storage.shift()
    }

    this._storage.push({key, value})
  },
})

const imageDimensionsCache = createCache(CACHE_SIZE)

const useImageDimensions = (image: ImageSource): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null)

  const getImageDimensions = (
    image: ImageSource,
  ): Promise<Dimensions | null> => {
    return new Promise(resolve => {
      if (image.uri) {
        const source = image as ImageURISource
        const cacheKey = source.uri as string
        const imageDimensions = imageDimensionsCache.get(cacheKey)
        if (imageDimensions) {
          resolve(imageDimensions)
        } else {
          Image.getSizeWithHeaders(
            // @ts-ignore
            source.uri,
            source.headers,
            (width: number, height: number) => {
              if (width > 0 && height > 0) {
                imageDimensionsCache.set(cacheKey, {width, height})
                resolve({width, height})
              } else {
                resolve(null)
              }
            },
            () => {
              resolve(null)
            },
          )
        }
      } else {
        resolve(null)
      }
    })
  }

  let isImageUnmounted = false

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    getImageDimensions(image).then(dimensions => {
      if (!isImageUnmounted) {
        setDimensions(dimensions)
      }
    })

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isImageUnmounted = true
    }
  }, [image])

  return dimensions
}

export default useImageDimensions
