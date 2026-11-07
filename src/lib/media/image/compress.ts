import {SaveFormat} from 'expo-image-manipulator'

import {moveIfNecessary} from '#/lib/media/image/cache'
import {renderImage} from '#/lib/media/image-manipulator'
import {type PickerImage} from '#/lib/media/picker.shared'
import {getDataUriSize} from '#/lib/media/util'
import {type ComposerImage} from '#/state/gallery'

export async function compressImage({
  image,
  maxDimension,
  maxSize,
}: {
  image: ComposerImage
  maxDimension: number
  maxSize: number
}): Promise<PickerImage> {
  const source = image.transformed || image.source

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

    const [w, h] = containImageRes({
      width: source.width,
      height: source.height,
      maxDimension: currentDimension,
    })
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
        base64: true,
      },
    )

    const base64 = res.base64
    const size = base64 ? getDataUriSize(base64) : 0
    if (base64 && size <= maxBytes) {
      minQualityPercentage = qualityPercentage
      newDataUri = {
        path: await moveIfNecessary({from: res.uri}),
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

function containImageRes({
  width,
  height,
  maxDimension,
}: {
  width: number
  height: number
  maxDimension: number
}): [width: number, height: number] {
  let scale = 1

  if (width > maxDimension || height > maxDimension) {
    scale = width > height ? maxDimension / width : maxDimension / height
    width = Math.floor(width * scale)
    height = Math.floor(height * scale)
  }

  return [width, height]
}
