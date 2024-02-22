import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import {Image as RNImage} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import {Image as ExpoImage} from 'expo-image'
import {
  cacheDirectory,
  createDownloadResumable,
  deleteAsync,
  getInfoAsync,
  moveAsync,
} from 'expo-file-system'
import uuid from 'react-native-uuid'
import * as Sharing from 'expo-sharing'
import * as MediaLibrary from 'expo-media-library'
import {Dimensions} from './types'
import {isAndroid} from 'platform/detection'
import * as FS from 'fs'

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
  const finalImageMovedPath = await moveToPermanentPath(resizedImage.path)
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
    deleteAsync(path)
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }

  // Usually we won't need to download the image because it will already be in the cache. If it isn't, then we
  // will download it
  let imageUri = await ExpoImage.getCachePathAsync(uri)
  let wasCached = true

  if (!imageUri) {
    // NOTE
    // assuming PNG
    // we're currently relying on the fact our CDN only serves pngs
    // -prf
    wasCached = false
    imageUri = await downloadImage(uri, createPath('png'), 1e5)
  }

  const imagePath = normalizePath(
    await moveToPermanentPath(imageUri, '.png'),
    true,
  )

  await Sharing.shareAsync(imagePath, {
    mimeType: 'image/png',
    UTI: 'image/png',
  })

  if (!wasCached) {
    deleteAsync(imageUri)
  }
  deleteAsync(imagePath)
}

export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  let imageUri = await ExpoImage.getCachePathAsync(uri)
  let wasCached = true

  if (!imageUri) {
    // NOTE
    // assuming PNG
    // we're currently relying on the fact our CDN only serves pngs
    // -prf
    wasCached = false
    imageUri = await downloadImage(uri, createPath('png'), 1e5)
  }

  const imagePath = normalizePath(
    await moveToPermanentPath(imageUri, '.png'),
    true,
  )

  await MediaLibrary.createAssetAsync(imagePath)

  if (!wasCached) {
    deleteAsync(imageUri)
  }
  deleteAsync(imagePath)
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
  for (let i = 0; i < 9; i++) {
    const quality = 1 - 0.1 * i
    // TODO We have a `mode` in react-native-image-resizer. What is this and do we need it here? Can we safely remove
    // this option? Is it used?
    const resizeRes = await manipulateAsync(
      localUri,
      [{resize: {height: opts.height, width: opts.width}}],
      {format: SaveFormat.JPEG, compress: quality},
    )
    // @ts-ignore Size is available here, typing is incorrect
    const info: FS.FileInfo & {size: number} = await getInfoAsync(
      resizeRes.uri,
      {
        size: true,
      },
    )
    if (info.size < opts.maxSize) {
      return {
        path: normalizePath(resizeRes.uri),
        mime: 'image/jpeg',
        size: info.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

async function moveToPermanentPath(path: string, ext = ''): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()

  // cacheDirectory should never be undefined unless on web. Since this only runs on native, we know that it will
  // always be defined.
  const destinationPath = joinPath(cacheDirectory ?? '/', `${filename}${ext}`)
  await moveAsync({
    from: path,
    to: destinationPath,
  })
  return normalizePath(destinationPath)
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

function createPath(ext: string) {
  return `${cacheDirectory ?? ''}/${uuid.v4()}.${ext}`
}

async function downloadImage(uri: string, path: string, timeout: number) {
  const downloadResumable = createDownloadResumable(uri, path, {
    cache: true,
  })

  const to1 = setTimeout(() => downloadResumable.cancelAsync(), timeout)
  const downloadRes = await downloadResumable.downloadAsync()
  clearTimeout(to1)

  if (!downloadRes?.uri) throw new Error()

  let localUri = downloadRes.uri
  if (!localUri.startsWith('file://')) {
    localUri = `file://${localUri}`
  }
  return localUri
}
