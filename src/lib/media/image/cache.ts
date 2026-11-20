import {Directory, File, Paths} from 'expo-file-system'
import {nanoid} from 'nanoid/non-secure'

import {IS_ANDROID, IS_NATIVE} from '#/env'

let _composerImageDirectory: Directory

/**
 * Where the composer keeps its own copies of attached images until the post is
 * sent. On Android this is outside the cache directory, because a nearly full
 * device deletes app caches about once a minute, including images in an open
 * composer. iOS only clears caches while the app isn't running, so they can
 * stay there. The composer purges this directory when it closes and when the
 * app launches.
 */
export function getComposerImageDirectory(): Directory | null {
  if (IS_NATIVE) {
    return (_composerImageDirectory ??= new Directory(
      IS_ANDROID ? Paths.document : Paths.cache,
      'bsky-composer',
    ))
  }

  return null
}

export async function moveIfNecessary(from: string) {
  const composerDir = IS_NATIVE && getComposerImageDirectory()

  if (composerDir && !from.startsWith(composerDir.uri)) {
    const source = new File(from.startsWith('/') ? `file://${from}` : from)
    const destination = new File(composerDir, nanoid(36))

    composerDir.create({idempotent: true, intermediates: true})
    await source.move(destination)

    return destination.uri
  }

  return from
}
