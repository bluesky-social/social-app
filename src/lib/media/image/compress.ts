import {createLimit} from '#/lib/async/limit'
import {compressToFit} from '#/lib/media/image/compressToFit'
import {type PickerImage} from '#/lib/media/picker.shared'
import {type ComposerImage} from '#/state/gallery'

/*
 * Each image being compressed holds at least one full-size decoded bitmap
 * (about 48 MB for a 12 MP photo), so compressing a 10-image gallery all at
 * once is enough to get the app killed for memory (APP-3190).
 */
const MAX_CONCURRENT_COMPRESSIONS = 2
const limit = createLimit(MAX_CONCURRENT_COMPRESSIONS)

/**
 * Compresses an image to fit within `maxDimension` and `maxSize`. At most
 * {@link MAX_CONCURRENT_COMPRESSIONS} images are compressed at once across the
 * app, so callers can start them all in parallel.
 */
export function compressImage(
  img: ComposerImage,
  opts: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  return limit(() => compressToFit(img.transformed || img.source, opts))
}
