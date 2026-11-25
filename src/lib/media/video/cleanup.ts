import {Directory, File, Paths} from 'expo-file-system'

import {logger} from '#/logger'
import {IS_IOS, IS_NATIVE} from '#/env'

/**
 * `@bsky.app/video-compressor` 0.3.1 and earlier write each compressed video
 * to `<UUID>.mp4` in the temp root (iOS) or cache root (Android), and never
 * delete it after a successful compress. iOS only empties `tmp/` when the
 * device is low on storage, so on iOS these pile up with every upload.
 */
const LEGACY_OUTPUT_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp4$/i

export function isLegacyCompressedVideo(name: string) {
  return LEGACY_OUTPUT_NAME.test(name)
}

/**
 * expo-file-system has no path for the iOS temp directory, but it always sits
 * next to `Documents/` in the app container.
 */
function getCompressorOutputRoot() {
  return IS_IOS ? new Directory(Paths.document, '..', 'tmp') : Paths.cache
}

/**
 * Deletes compressed videos left behind by earlier uploads. Only call this
 * when no upload is in flight, since it can delete the file being uploaded.
 */
export function purgeCompressedVideos() {
  if (!IS_NATIVE) {
    return
  }

  let items: (Directory | File)[]
  try {
    const root = getCompressorOutputRoot()
    if (!root.exists) {
      return
    }
    items = root.list()
  } catch (err) {
    logger.warn('Failed to list compressed videos', {safeMessage: err})
    return
  }

  for (const item of items) {
    if (!(item instanceof File) || !isLegacyCompressedVideo(item.name)) {
      continue
    }
    try {
      item.delete()
    } catch (err) {
      logger.warn('Failed to delete compressed video', {safeMessage: err})
    }
  }
}
