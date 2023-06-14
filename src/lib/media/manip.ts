import RNFetchBlob from 'rn-fetch-blob'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import {Image as RNImage, Share as RNShare} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import * as RNFS from 'react-native-fs'
import uuid from 'react-native-uuid'
import * as Sharing from 'expo-sharing'
import {Dimensions} from './types'
import {isAndroid, isIOS} from 'platform/detection'

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

  let downloadRes
  try {
    const downloadResPromise = RNFetchBlob.config({
      fileCache: true,
      appendExt,
    }).fetch('GET', opts.uri)
    const to1 = setTimeout(() => downloadResPromise.cancel(), opts.timeout)
    downloadRes = await downloadResPromise
    clearTimeout(to1)

    let localUri = downloadRes.path()
    if (!localUri.startsWith('file://')) {
      localUri = `file://${localUri}`
    }

    return await doResize(localUri, opts)
  } finally {
    if (downloadRes) {
      downloadRes.flush()
    }
  }
}

export async function saveImageModal({uri}: {uri: string}) {
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
  RNFS.unlink(imagePath)
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
    const quality = 100 - i * 10
    const resizeRes = await ImageResizer.createResizedImage(
      localUri,
      opts.width,
      opts.height,
      'JPEG',
      quality,
      undefined,
      undefined,
      undefined,
      {mode: opts.mode},
    )
    if (resizeRes.size < opts.maxSize) {
      return {
        path: normalizePath(resizeRes.path),
        mime: 'image/jpeg',
        size: resizeRes.size,
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

  const destinationPath = joinPath(
    RNFS.TemporaryDirectoryPath,
    `${filename}${ext}`,
  )
  await RNFS.moveFile(path, destinationPath)
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
