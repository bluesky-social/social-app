import {File} from 'expo-file-system'
import {compressImage as compressNatively} from '@bsky.app/expo-bluesky-image-compressor'

import {moveIfNecessary} from '#/lib/media/image/cache'
import {compressWithManipulator} from '#/lib/media/image/compressWithManipulator'
import {ImageMissingError} from '#/lib/media/image/errors'
import {type PickerImage} from '#/lib/media/picker.shared'
import {logger} from '#/logger'
import {type ImageMeta} from '#/state/gallery'
import {Features, features} from '#/analytics/features'

/**
 * Re-encodes the image as a JPEG that fits `maxDimension` and `maxSize`. The
 * native module decodes the image once and tries each quality in memory.
 */
export async function compressToFit(
  source: ImageMeta,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  assertImageExists(source.path)

  if (!features.isOn(Features.ImageUploadsNativeCompressionEnable)) {
    return compressWithManipulator(source, {maxDimension, maxSize})
  }

  const res = await compressNatively(source.path, {
    maxDimension,
    maxBytes: maxSize,
  })
  logger.debug('Compressed image', {
    width: res.width,
    height: res.height,
    size: res.size,
    quality: res.quality,
  })
  return {
    path: await moveIfNecessary(res.uri),
    width: res.width,
    height: res.height,
    mime: 'image/jpeg',
    size: res.size,
  }
}

/**
 * Both compressors report a missing file differently (the manipulator only says
 * "Loading bitmap failed"), so check up front to give the composer an error it
 * can explain. Only local files can go missing.
 */
function assertImageExists(path: string) {
  const uri = path.startsWith('/') ? `file://${path}` : path
  if (uri.startsWith('file://') && !new File(uri).exists) {
    throw new ImageMissingError(path)
  }
}
