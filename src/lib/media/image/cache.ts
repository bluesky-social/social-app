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
    return (_imageCacheDirectory ??= joinPath({
      base: cacheDirectory!,
      path: 'bsky-composer',
    }))
  }

  return null
}

export async function moveIfNecessary({from}: {from: string}) {
  const cacheDir = IS_NATIVE && getImageCacheDirectory()

  if (cacheDir && !from.startsWith(cacheDir)) {
    const to = joinPath({base: cacheDir, path: nanoid(36)})

    await makeDirectoryAsync(cacheDir, {intermediates: true})
    await moveAsync({from, to})

    return to
  }

  return from
}

export function joinPath({base, path}: {base: string; path: string}) {
  if (base.endsWith('/')) {
    if (path.startsWith('/')) {
      return base.slice(0, -1) + path
    }
    return base + path
  } else if (path.startsWith('/')) {
    return base + path
  }
  return base + '/' + path
}
