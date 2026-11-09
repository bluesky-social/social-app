import {SaveFormat} from 'expo-image-manipulator'

import {createLimit} from '#/lib/async/limit'
import {moveIfNecessary} from '#/lib/media/image/cache'
import {renderImage} from '#/lib/media/image-manipulator'
import {type PickerImage} from '#/lib/media/picker.shared'
import {getUriSize} from '#/lib/media/uriSize'
import {type ComposerImage} from '#/state/gallery'

/*
 * Each image being compressed holds full-size decoded bitmaps while it renders
 * (about 48 MB each for a 12 MP photo on iOS), and iOS starts decoding as
 * soon as a manipulation is created. Compressing a 10-image gallery all at
 * once is enough to get the app killed for memory (APP-3190). iOS encodes on a
 * single serial queue anyway, so running more than two at once buys little.
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
  return limit(() => compressImageNow(img, opts))
}

async function compressImageNow(
  img: ComposerImage,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  const source = img.transformed || img.source

  let attempts = 0
  /*
   * Seeded from `maxDimension` but shrunk per attempt below, so keep the
   * passed-in value pristine.
   */
  let currentDimension = maxDimension
  const maxBytes = maxSize

  let minQualityPercentage = 0
  let maxQualityPercentage = 101 // exclusive
  let newDataUri

  while (maxQualityPercentage - minQualityPercentage > 1) {
    if (attempts >= 4) break

    const [w, h] = containImageRes(
      source.width,
      source.height,
      currentDimension,
    )
    const qualityPercentage = Math.round(
      (maxQualityPercentage + minQualityPercentage) / 2,
    )

    /*
     * In the event the image doesn't compress well, we want to avoid
     * unecessary iterations. In this case, binary search will check 51, 26,
     * 13(rounded). We don't want to go below 25, so if we've halved to 13,
     * reset the loop and reduce the image dimensions instead.
     */
    if (qualityPercentage <= 13) {
      minQualityPercentage = 0
      maxQualityPercentage = 101
      attempts++
      /*
       * max.width -> 0.8x -> 0.64x -> 0.512x -> ~0.41x
       * e.g. 4000px -> 3200px -> 2560px -> 2048px -> ~1638px
       */
      currentDimension = Math.floor(currentDimension * 0.8)
      continue
    }

    const res = await renderImage(
      source.path,
      context => context.resize({width: w, height: h}),
      {
        compress: qualityPercentage / 100,
        format: SaveFormat.JPEG,
      },
    )

    /*
     * Measure the written file rather than requesting base64, which would
     * encode the JPEG a second time and copy it into JS on every pass.
     */
    const size = await getUriSize(res.uri)
    if (size <= maxBytes) {
      minQualityPercentage = qualityPercentage
      newDataUri = {
        path: await moveIfNecessary(res.uri),
        width: res.width,
        height: res.height,
        mime: 'image/jpeg',
        size,
      }
    } else {
      maxQualityPercentage = qualityPercentage
    }
  }

  if (newDataUri) {
    return newDataUri
  }

  throw new Error(`Unable to compress image`)
}

function containImageRes(
  w: number,
  h: number,
  max: number,
): [width: number, height: number] {
  let scale = 1

  if (w > max || h > max) {
    scale = w > h ? max / w : max / h
    w = Math.floor(w * scale)
    h = Math.floor(h * scale)
  }

  return [w, h]
}
