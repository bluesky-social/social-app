import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy'
import {type ImageManipulatorContext, SaveFormat} from 'expo-image-manipulator'
import {nanoid} from 'nanoid/non-secure'

import {
  getImageCacheDirectory,
  joinPath,
  moveIfNecessary,
} from '#/lib/media/image/cache'
import {renderImage} from '#/lib/media/image-manipulator'
import {getImageDim} from '#/lib/media/manip'
import {openCropper} from '#/lib/media/picker'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {IS_NATIVE, IS_WEB} from '#/env'

export {compressImage} from '#/lib/media/image/compress'

export type ImageTransformation = {
  crop?: Parameters<ImageManipulatorContext['crop']>[0]
}

export type ImageMeta = {
  path: string
  width: number
  height: number
  mime: string
}

export type ImageSource = ImageMeta & {
  id: string
}

type ComposerImageBase = {
  alt: string
  source: ImageSource
  /** Original localRef path from draft, if editing an existing draft. Used to reuse the same storage key. */
  localRefPath?: string
}
type ComposerImageWithoutTransformation = ComposerImageBase & {
  transformed?: undefined
  manips?: undefined
}
type ComposerImageWithTransformation = ComposerImageBase & {
  transformed: ImageMeta
  manips?: ImageTransformation
}

export type ComposerImage =
  ComposerImageWithoutTransformation | ComposerImageWithTransformation

export async function createComposerImage(
  raw: ImageMeta,
): Promise<ComposerImageWithoutTransformation> {
  return {
    alt: '',
    source: {
      id: nanoid(),
      // Copy to cache to ensure file survives OS temporary file cleanup
      path: await copyToCache(raw.path),
      width: raw.width,
      height: raw.height,
      mime: raw.mime,
    },
  }
}

export type InitialImage = {
  uri: string
  width: number
  height: number
  altText?: string
}

export function createInitialImages(
  uris: InitialImage[] = [],
): ComposerImageWithoutTransformation[] {
  return uris.map(({uri, width, height, altText = ''}) => {
    return {
      alt: altText,
      source: {
        id: nanoid(),
        path: uri,
        width: width,
        height: height,
        mime: 'image/jpeg',
      },
    }
  })
}

export async function pasteImage(
  uri: string,
): Promise<ComposerImageWithoutTransformation> {
  const {width, height} = await getImageDim(uri)
  const match = /^data:(.+?);/.exec(uri)

  return {
    alt: '',
    source: {
      id: nanoid(),
      path: uri,
      width: width,
      height: height,
      mime: match ? match[1] : 'image/jpeg',
    },
  }
}

export async function cropImage(img: ComposerImage): Promise<ComposerImage> {
  if (!IS_NATIVE) {
    return img
  }

  const source = img.source

  // @todo: we're always passing the original image here, does image-cropper
  // allows for setting initial crop dimensions? -mary
  try {
    const cropped = await openCropper({
      imageUri: source.path,
    })

    return {
      alt: img.alt,
      source: source,
      transformed: {
        path: await moveIfNecessary(cropped.path),
        width: cropped.width,
        height: cropped.height,
        mime: cropped.mime,
      },
    }
  } catch (e) {
    if (!isCancelledError(e)) {
      logger.error('Failed to crop image', {safeMessage: e})
      return img
    }

    throw e
  }
}

export async function manipulateImage(
  img: ComposerImage,
  trans: ImageTransformation,
): Promise<ComposerImage> {
  const crop = trans.crop
  if (!crop) {
    if (img.transformed === undefined) {
      return img
    }

    return {alt: img.alt, source: img.source}
  }

  const source = img.source
  const result = await renderImage(source.path, context => context.crop(crop), {
    format: SaveFormat.PNG,
  })

  return {
    alt: img.alt,
    source: img.source,
    transformed: {
      path: await moveIfNecessary(result.uri),
      width: result.width,
      height: result.height,
      mime: 'image/png',
    },
    manips: trans,
  }
}

export function resetImageManipulation(
  img: ComposerImage,
): ComposerImageWithoutTransformation {
  if (img.transformed !== undefined) {
    return {alt: img.alt, source: img.source}
  }

  return img
}

/**
 * Copy a file from a potentially temporary location to our cache directory.
 * This ensures picker files are available for draft saving even if the original
 * temporary files are cleaned up by the OS.
 *
 * On web, converts blob URLs to data URIs immediately to prevent revocation issues.
 */
async function copyToCache(from: string): Promise<string> {
  // Data URIs don't need any conversion
  if (from.startsWith('data:')) {
    return from
  }

  if (IS_WEB) {
    // Web: convert blob URLs to data URIs before they can be revoked
    if (from.startsWith('blob:')) {
      try {
        const response = await fetch(from)
        const blob = await response.blob()
        return await blobToDataUri(blob)
      } catch (e) {
        // Blob URL was likely revoked, return as-is for downstream error handling
        return from
      }
    }
    // Other URLs on web don't need conversion
    return from
  }

  // Native: copy to cache directory to survive OS temp file cleanup
  const cacheDir = getImageCacheDirectory()
  if (!cacheDir || from.startsWith(cacheDir)) {
    return from
  }

  const to = joinPath(cacheDir, nanoid(36))
  await makeDirectoryAsync(cacheDir, {intermediates: true})

  let normalizedFrom = from
  if (!from.startsWith('file://') && from.startsWith('/')) {
    normalizedFrom = `file://${from}`
  }

  await copyAsync({from: normalizedFrom, to})
  return to
}

/**
 * Convert a Blob to a data URI
 */
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to data URI'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Caches that the OS image picker and manipulator write into when attaching
 * media to a post. They live alongside our own `bsky-composer` dir under the OS
 * cache directory. expo-image-picker copies every originally selected photo and
 * video here, and expo-image-manipulator leaves intermediate full-resolution
 * outputs here (compressImage makes several rendering passes, only the last of
 * which gets moved into `bsky-composer`). Nothing else cleans these up,
 * so on iOS - where the OS exposes no "clear cache" - they accumulate
 * indefinitely, one full-resolution copy per attached item.
 */
const SYSTEM_MEDIA_CACHE_DIRS = ['ImagePicker', 'ImageManipulator']

/** Purge files that were created to accomodate image manipulation */
export async function purgeTemporaryImageFiles() {
  if (!IS_NATIVE) {
    return
  }

  const cacheDir = getImageCacheDirectory()
  if (cacheDir) {
    await deleteAsync(cacheDir, {idempotent: true})
    await makeDirectoryAsync(cacheDir)
  }

  // We don't recreate these - the respective expo modules recreate them on
  // demand the next time they run.
  await Promise.all(
    SYSTEM_MEDIA_CACHE_DIRS.map(dir =>
      deleteAsync(joinPath(cacheDirectory!, dir), {idempotent: true}),
    ),
  )
}
