import {Image as RNImage, Share as RNShare} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import uuid from 'react-native-uuid'
import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from 'expo-file-system'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {Buffer} from 'buffer'
import RNFetchBlob from 'rn-fetch-blob'

import {POST_IMG_MAX} from '#/lib/constants'
import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
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

  let downloadRes
  try {
    const downloadResPromise = RNFetchBlob.config({
      fileCache: true,
      appendExt,
    }).fetch('GET', opts.uri)
    const to1 = setTimeout(() => downloadResPromise.cancel(), opts.timeout)
    downloadRes = await downloadResPromise
    clearTimeout(to1)

    const status = downloadRes.info().status
    if (status !== 200) {
      return
    }

    const localUri = normalizePath(downloadRes.path(), true)
    return await doResize(localUri, opts)
  } finally {
    // TODO Whenever we remove `rn-fetch-blob`, we will need to replace this `flush()` with a `deleteAsync()` -hailey
    if (downloadRes) {
      downloadRes.flush()
    }
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)

  // NOTE
  // assuming PNG
  // we're currently relying on the fact our CDN only serves pngs
  // -prf

  let imagePath = downloadResponse.path()
  imagePath = normalizePath(await moveToPermanentPath(imagePath, '.png'), true)

  // NOTE
  // for some reason expo-sharing refuses to work on iOS
  // ...and visa versa
  // -prf
  if (isIOS) {
    await RNShare.share({url: imagePath})
  } else {
    await Sharing.shareAsync(imagePath, {
      mimeType: 'image/png',
      UTI: 'image/png',
    })
  }

  safeDeleteAsync(imagePath)
}

export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  // download the file to cache
  // NOTE
  // assuming PNG
  // we're currently relying on the fact our CDN only serves pngs
  // -prf
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)
  let imagePath = downloadResponse.path()
  imagePath = normalizePath(await moveToPermanentPath(imagePath, '.png'), true)

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
  // We need to get the dimensions of the image before we resize it. Previously, the library we used allowed us to enter
  // a "max size", and it would do the "best possible size" calculation for us.
  // Now instead, we have to supply the final dimensions to the manipulation function instead.
  // Performing an "empty" manipulation lets us get the dimensions of the original image. React Native's Image.getSize()
  // does not work for local files...
  const imageRes = await manipulateAsync(localUri, [], {})
  const newDimensions = getResizedDimensions({
    width: imageRes.width,
    height: imageRes.height,
  })

  for (let i = 0; i < 9; i++) {
    // nearest 10th
    const quality = Math.round((1 - 0.1 * i) * 10) / 10
    const resizeRes = await manipulateAsync(
      localUri,
      [{resize: newDimensions}],
      {
        format: SaveFormat.JPEG,
        compress: quality,
      },
    )

    const fileInfo = await getInfoAsync(resizeRes.uri)
    if (!fileInfo.exists) {
      throw new Error(
        'The image manipulation library failed to create a new image.',
      )
    }

    if (fileInfo.size < opts.maxSize) {
      safeDeleteAsync(imageRes.uri)
      return {
        path: normalizePath(resizeRes.uri),
        mime: 'image/jpeg',
        size: fileInfo.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    } else {
      safeDeleteAsync(resizeRes.uri)
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

async function moveToPermanentPath(path: string, ext: string): Promise<string> {
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
    to: normalizePath(destinationPath),
  })
  safeDeleteAsync(path)
  return normalizePath(destinationPath)
}

export async function safeDeleteAsync(path: string) {
  // Normalize is necessary for Android, otherwise it doesn't delete.
  const normalizedPath = normalizePath(path)
  try {
    await deleteAsync(normalizedPath, {idempotent: true})
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

function normalizePath(str: string, allPlatforms = false): string {
  if (isAndroid || allPlatforms) {
    if (!str.startsWith('file://')) {
      return `file://${str}`
    }
  }
  return str
}

export async function saveBytesToDisk(
  filename: string,
  bytes: Uint8Array,
  type: string,
) {
  const encoded = Buffer.from(bytes).toString('base64')
  return await saveToDevice(filename, encoded, type)
}

export async function saveToDevice(
  filename: string,
  encoded: string,
  type: string,
) {
  try {
    if (isIOS) {
      await withTempFile(filename, encoded, async tmpFileUrl => {
        await Sharing.shareAsync(tmpFileUrl, {UTI: type})
      })
      return true
    } else {
      const permissions =
        await StorageAccessFramework.requestDirectoryPermissionsAsync()

      if (!permissions.granted) {
        return false
      }

      const fileUrl = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        type,
      )

      await writeAsStringAsync(fileUrl, encoded, {
        encoding: EncodingType.Base64,
      })
      return true
    }
  } catch (e) {
    logger.error('Error occurred while saving file', {message: e})
    return false
  }
}

async function withTempFile<T>(
  filename: string,
  encoded: string,
  cb: (url: string) => T | Promise<T>,
): Promise<T> {
  // cacheDirectory will not ever be null so we assert as a string.
  // Using a directory so that the file name is not a random string
  const tmpDirUri = joinPath(cacheDirectory as string, String(uuid.v4()))
  await makeDirectoryAsync(tmpDirUri, {intermediates: true})

  try {
    const tmpFileUrl = joinPath(tmpDirUri, filename)
    await writeAsStringAsync(tmpFileUrl, encoded, {
      encoding: EncodingType.Base64,
    })

    return await cb(tmpFileUrl)
  } finally {
    safeDeleteAsync(tmpDirUri)
  }
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
