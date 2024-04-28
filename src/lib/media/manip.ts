import {Image as RNImage} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import uuid from 'react-native-uuid'
import {
  cacheDirectory,
  copyAsync,
  createDownloadResumable,
  deleteAsync,
  FileInfo,
  getInfoAsync,
} from 'expo-file-system'
import {Image as ExpoImage} from 'expo-image'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'

import {POST_IMG_MAX} from 'lib/constants'
import {Dimensions} from './types'

export async function compressIfNeeded(
  img: Image,
  maxSize: number = 1000000,
): Promise<Image> {
  const origUri = `file://${img.path}`
  if (img.size < maxSize) {
    return img
  }
  const resizedImage = await doResize(origUri, {
    width: img.width,
    height: img.height,
    mode: 'stretch',
    maxSize,
  })
  const finalImageMovedPath = await moveToPermanentPath(
    resizedImage.path,
    '.jpg',
  )
  const finalImg = {
    ...resizedImage,
    path: finalImageMovedPath,
  }
  return finalImg
}

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  let appendExt = 'jpeg'
  try {
    const urip = new URL(opts.uri)
    const ext = urip.pathname.split('.').pop()
    if (ext === 'png') {
      appendExt = 'png'
    }
  } catch (e: any) {
    console.error('Invalid URI', opts.uri, e)
    return
  }

  const path = createPath(appendExt)

  try {
    await downloadImage(opts.uri, path, opts.timeout)
    return await doResize(path, opts)
  } finally {
    safeDeleteAsync(path)
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }

  // Usually whenever we share an image it will already be available in the cache. If it isn't, then we
  // will download it.
  let imageUri = await ExpoImage.getCachePathAsync(uri)
  if (!imageUri) {
    // NOTE
    // assuming PNG
    // we're currently relying on the fact our CDN only serves pngs
    // -prf
    imageUri = await downloadImage(uri, createPath('png'), 5e3)
  }

  const imagePath = await moveToPermanentPath(imageUri, '.png')

  await Sharing.shareAsync(imagePath, {
    mimeType: 'image/png',
    UTI: 'image/png',
  })

  safeDeleteAsync(imagePath)
}

export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  let imageUri = await ExpoImage.getCachePathAsync(uri)
  if (!imageUri) {
    // download the file to cache
    // NOTE
    // assuming PNG
    // we're currently relying on the fact our CDN only serves pngs
    // -prf
    imageUri = await downloadImage(uri, createPath('png'), 5e3)
  }

  const imagePath = await moveToPermanentPath(imageUri, '.png')

  // save
  await MediaLibrary.createAssetAsync(imagePath)
  safeDeleteAsync(imagePath)
}

export function getImageDim(path: string): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      path,
      (width, height) => {
        resolve({width, height})
      },
      reject,
    )
  })
}

// internal methods
// =

interface DoResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

async function doResize(localUri: string, opts: DoResizeOpts): Promise<Image> {
  // This is a bit of a hack, but it lets us get the original size of the image. The old image manipulation library
  // allowed us to supply a max height/width and it would handle the resizing. With expo-image-manipulator, we have
  // to supply the exact size and width that we want to resize to instead. We will calculate that ourselves based on
  // the height/width results of this first manipulation
  const imageRes = await manipulateAsync(localUri, [], {
    format: SaveFormat.JPEG,
  })

  const newDimensions = getResizedDimensions({
    width: imageRes.width,
    height: imageRes.height,
  })

  for (let i = 0; i < 9; i++) {
    const quality = 0.9 - 0.1 * i
    const resizeRes = await manipulateAsync(
      localUri,
      [{resize: {height: newDimensions.height, width: newDimensions.width}}],
      {
        format: SaveFormat.JPEG,
        compress: quality,
      },
    )

    const info: FileInfo = await getInfoAsync(resizeRes.uri, {
      size: true,
    })

    // I'm not sure this can happen, but if we don't check `.exists`, then the `.size` type is undefined.
    if (!info.exists) {
      throw new Error(
        'The image manipulation library failed to create a new image.',
      )
    }

    // We want to clean up every resize _except_ the final result. We'll clean that one up later when we're finished
    // with it
    if (info.size < opts.maxSize) {
      await deleteAsync(imageRes.uri)
      return {
        path: normalizePath(resizeRes.uri),
        mime: 'image/jpeg',
        size: info.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    } else {
      safeDeleteAsync(resizeRes.path)
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

async function moveToPermanentPath(path: string, ext = 'jpg'): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()

  // cacheDirectory will not ever be null on native, but it could be on web. This function only ever gets called on
  // native so we assert as a string.
  const destinationPath = joinPath(cacheDirectory as string, filename + ext)
  await copyAsync({
    from: normalizePath(path),
    to: destinationPath,
  })

  // This is just to try and clean up whenever we can. We won't always be able to, so in cases where we can't
  // we just catch the error.
  // Paths that are image caches shouldn't be removed. com.hackemist.SDImageCache is used by SDWebImage and
  // image_manager_disk_cache is used by Glide
  if (
    !path.includes('com.hackemist.SDImageCache') &&
    !path.includes('image_manager_disk_cache')
  ) {
    safeDeleteAsync(path)
  }

  return normalizePath(destinationPath)
}

export async function safeDeleteAsync(path: string) {
  // Normalize is necessary for Android, otherwise it doesn't delete.
  const normalizedPath = normalizePath(path)
  try {
    await Promise.allSettled([
      deleteAsync(normalizedPath, {idempotent: true}),
      // HACK: Try this one too. Might exist due to api-polyfill hack.
      deleteAsync(normalizedPath.replace(/\.jpe?g$/, '.bin'), {
        idempotent: true,
      }),
    ])
  } catch (e) {
    console.error('Failed to delete file', e)
  }
}

function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b
}

function normalizePath(str: string): string {
  if (!str.startsWith('file://')) {
    return `file://${str}`
  }
  return str
}

function createPath(ext: string) {
  // cacheDirectory will never be null on native, so the null check here is not necessary except for typescript.
  // we use a web-only function for downloadAndResize on web
  return `${cacheDirectory ?? ''}/${uuid.v4()}.${ext}`
}

async function downloadImage(uri: string, path: string, timeout: number) {
  const downloadResumable = createDownloadResumable(uri, path, {
    cache: true,
  })

  const to1 = setTimeout(() => downloadResumable.cancelAsync(), timeout)
  const downloadRes = await downloadResumable.downloadAsync()
  clearTimeout(to1)

  if (!downloadRes?.uri) {
    throw new Error()
  }

  return normalizePath(downloadRes.uri)
}

export function getResizedDimensions(originalDims: {
  width: number
  height: number
}) {
  if (
    originalDims.width <= POST_IMG_MAX.width &&
    originalDims.height <= POST_IMG_MAX.height
  ) {
    return originalDims
  }

  const ratio = Math.min(
    POST_IMG_MAX.width / originalDims.width,
    POST_IMG_MAX.height / originalDims.height,
  )

  return {
    width: Math.round(originalDims.width * ratio),
    height: Math.round(originalDims.height * ratio),
  }
}
