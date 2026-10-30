import {Directory, File, Paths} from 'expo-file-system'
import {nanoid} from 'nanoid/non-secure'

import {IS_NATIVE} from '#/env'

let _imageCacheDirectory: Directory

export function getImageCacheDirectory(): Directory | null {
  if (IS_NATIVE) {
    return (_imageCacheDirectory ??= new Directory(
      Paths.cache,
      'bsky-composer',
    ))
  }

  return null
}

export async function moveIfNecessary(from: string) {
  const cacheDir = IS_NATIVE && getImageCacheDirectory()

  if (cacheDir && !from.startsWith(cacheDir.uri)) {
    const source = new File(from.startsWith('/') ? `file://${from}` : from)
    const destination = new File(cacheDir, nanoid(36))

    cacheDir.create({idempotent: true, intermediates: true})
    await source.move(destination)

    return destination.uri
  }

  return from
}
