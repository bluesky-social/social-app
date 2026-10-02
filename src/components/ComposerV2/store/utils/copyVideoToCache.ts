import {File, Paths} from 'expo-file-system'
import {nanoid} from 'nanoid/non-secure'

import {mimeToExt} from '#/lib/media/video/util'

/**
 * Copy a native video to a cache file with a simple name. Android draft
 * storage names files with an encoded local ref, and its file URIs encode that
 * name again; the native metadata probe and compressor cannot read the result.
 * The existing composer copies restored Android videos for the same reason.
 *
 * The caller owns the copy and must call `release` once nothing reads it,
 * including a compressor pass-through that returns the copy's URI.
 */
export async function copyVideoToCache({
  uri,
  mimeType,
}: {
  uri: string
  mimeType?: string
}): Promise<{uri: string; release: () => void}> {
  const extension = mimeType ? videoExtension({mimeType}) : undefined
  const copy = new File(
    Paths.cache,
    `composer-v2-video-${nanoid()}${extension ? `.${extension}` : ''}`,
  )
  await new File(uri).copy(copy)
  return {
    uri: copy.uri,
    release: () => {
      if (copy.exists) copy.delete()
    },
  }
}

function videoExtension({mimeType}: {mimeType: string}) {
  try {
    return mimeToExt(mimeType)
  } catch {
    return undefined
  }
}
