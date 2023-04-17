import RNFetchBlob from 'rn-fetch-blob'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import {Image as RNImage, Share} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import RNFS from 'react-native-fs'
import uuid from 'react-native-uuid'
import * as Toast from 'view/com/util/Toast'
import {Dimensions} from './types'
import {POST_IMG_MAX} from 'lib/constants'
import {isAndroid} from 'platform/detection'

export async function compressAndResizeImageForPost(
  image: Image,
): Promise<Image> {
  const uri = `file://${image.path}`
  let resized: Omit<Image, 'mime'>

  for (let i = 0; i < 9; i++) {
    const quality = 100 - i * 10

    try {
      resized = await ImageResizer.createResizedImage(
        uri,
        POST_IMG_MAX.width,
        POST_IMG_MAX.height,
        'JPEG',
        quality,
        undefined,
        undefined,
        undefined,
        {mode: 'cover'},
      )
    } catch (err) {
      throw new Error(`Failed to resize: ${err}`)
    }

    if (resized.size < POST_IMG_MAX.size) {
      const path = await moveToPermanentPath(resized.path)

      return {
        path,
        mime: 'image/jpeg',
        size: resized.size,
        height: resized.height,
        width: resized.width,
      }
    }
  }

  throw new Error(
    `This image is too big! We couldn't compress it down to ${POST_IMG_MAX.size} bytes`,
  )
}

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
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)

  const imagePath = downloadResponse.path()
  const base64Data = await downloadResponse.readFile('base64')
  const result = await Share.share({
    url: 'data:image/png;base64,' + base64Data,
  })
  if (result.action === Share.sharedAction) {
    Toast.show('Image saved to gallery')
  } else if (result.action === Share.dismissedAction) {
    // dismissed
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

async function moveToPermanentPath(path: string): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()

  const destinationPath = `${RNFS.TemporaryDirectoryPath}/${filename}`
  await RNFS.moveFile(path, destinationPath)
  return normalizePath(destinationPath)
}

function normalizePath(str: string): string {
  if (isAndroid) {
    if (!str.startsWith('file://')) {
      return `file://${str}`
    }
  }
  return str
}
