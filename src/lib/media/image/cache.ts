import {
  cacheDirectory,
  makeDirectoryAsync,
  moveAsync,
} from 'expo-file-system/legacy'
import {nanoid} from 'nanoid/non-secure'

import {IS_NATIVE} from '#/env'

let _imageCacheDirectory: string

export function getImageCacheDirectory(): string | null {
  if (IS_NATIVE) {
    return (_imageCacheDirectory ??= joinPath(cacheDirectory!, 'bsky-composer'))
  }

  return null
}

export async function moveIfNecessary(from: string) {
  const cacheDir = IS_NATIVE && getImageCacheDirectory()

  if (cacheDir && !from.startsWith(cacheDir)) {
    const to = joinPath(cacheDir, nanoid(36))

    await makeDirectoryAsync(cacheDir, {intermediates: true})
    await moveAsync({from, to})

    return to
  }

  return from
}

export function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b
}
