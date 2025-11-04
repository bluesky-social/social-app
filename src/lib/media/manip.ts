import {Image as RNImage} from 'react-native'
import uuid from 'react-native-uuid'
import {
  cacheDirectory,
  copyAsync,
  createDownloadResumable,
  deleteAsync,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from 'expo-file-system/legacy'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {Buffer} from 'buffer'

import {POST_IMG_MAX} from '#/lib/constants'
import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
import {type PickerImage} from './picker.shared'
import {type Dimensions} from './types'

export async function compressIfNeeded(
  img: PickerImage,
  maxSize: number = POST_IMG_MAX.size,
): Promise<PickerImage> {
  if (img.size < maxSize) {
    return img
  }
  const resizedImage = await doResize(normalizePath(img.path), {
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

  // we're currently relying on the fact our CDN only serves pngs
  // -prf
  const imageUri = await downloadImage(uri, createPath('png'), 5e3)
  const imagePath = await moveToPermanentPath(imageUri, '.png')
  safeDeleteAsync(imageUri)
  await Sharing.shareAsync(imagePath, {
    mimeType: 'image/png',
    UTI: 'image/png',
  })
}

const ALBUM_NAME = 'Bluesky'

export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  // download the file to cache
  // NOTE
  // assuming PNG
  // we're currently relying on the fact our CDN only serves pngs
  // -prf
  const imageUri = await downloadImage(uri, createPath('png'), 5e3)
  const imagePath = await moveToPermanentPath(imageUri, '.png')

  // save
  try {
    if (isAndroid) {
      // android triggers an annoying permission prompt if you try and move an image
      // between albums. therefore, we need to either create the album with the image
      // as the starting image, or put it directly into the album
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME)
      if (album) {
        // try and migrate if needed
        try {
          if (await MediaLibrary.albumNeedsMigrationAsync(album)) {
            await MediaLibrary.migrateAlbumIfNeededAsync(album)
          }
        } catch (err) {
          logger.info('Attempted and failed to migrate album', {
            safeMessage: err,
          })
        }

        try {
          // if album exists, put the image straight in there
          await MediaLibrary.createAssetAsync(imagePath, album)
        } catch (err) {
          logger.info('Failed to create asset', {safeMessage: err})
          // however, it's possible that we don't have write permission to the album
          // try making a new one!
          try {
            await MediaLibrary.createAlbumAsync(
              ALBUM_NAME,
              undefined,
              undefined,
              imagePath,
            )
          } catch (err2) {
            logger.info('Failed to create asset in a fresh album', {
              safeMessage: err2,
            })
            // ... and if all else fails, just put it in DCIM
            await MediaLibrary.createAssetAsync(imagePath)
          }
        }
      } else {
        // otherwise, create album with asset (albums must always have at least one asset)
        await MediaLibrary.createAlbumAsync(
          ALBUM_NAME,
          undefined,
          undefined,
          imagePath,
        )
      }
    } else {
      await MediaLibrary.saveToLibraryAsync(imagePath)
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : String(err), {
      message: 'Failed to save image to media library',
    })
    throw err
  } finally {
    safeDeleteAsync(imagePath)
  }
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

async function doResize(
  localUri: string,
  opts: DoResizeOpts,
): Promise<PickerImage> {
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

  let minQualityPercentage = 0
  let maxQualityPercentage = 101 // exclusive
  let newDataUri
  const intermediateUris = []

  while (maxQualityPercentage - minQualityPercentage > 1) {
    const qualityPercentage = Math.round(
      (maxQualityPercentage + minQualityPercentage) / 2,
    )
    const resizeRes = await manipulateAsync(
      localUri,
      [{resize: newDimensions}],
      {
        format: SaveFormat.JPEG,
        compress: qualityPercentage / 100,
      },
    )

    intermediateUris.push(resizeRes.uri)

    const fileInfo = await getInfoAsync(resizeRes.uri)
    if (!fileInfo.exists) {
      throw new Error(
        'The image manipulation library failed to create a new image.',
      )
    }

    if (fileInfo.size < opts.maxSize) {
      minQualityPercentage = qualityPercentage
      newDataUri = {
        path: normalizePath(resizeRes.uri),
        mime: 'image/jpeg',
        size: fileInfo.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    } else {
      maxQualityPercentage = qualityPercentage
    }
  }

  for (const intermediateUri of intermediateUris) {
    if (newDataUri?.path !== normalizePath(intermediateUri)) {
      safeDeleteAsync(intermediateUri)
    }
  }

  if (newDataUri) {
    safeDeleteAsync(imageRes.uri)
    return newDataUri
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

function createPath(ext: string) {
  // cacheDirectory will never be null on native, so the null check here is not necessary except for typescript.
  // we use a web-only function for downloadAndResize on web
  return `${cacheDirectory ?? ''}/${uuid.v4()}.${ext}`
}

async function downloadImage(uri: string, path: string, timeout: number) {
  const dlResumable = createDownloadResumable(uri, path, {cache: true})
  let timedOut = false
  const to1 = setTimeout(() => {
    timedOut = true
    dlResumable.cancelAsync()
  }, timeout)

  const dlRes = await dlResumable.downloadAsync()
  clearTimeout(to1)

  if (!dlRes?.uri) {
    if (timedOut) {
      throw new Error('Failed to download image - timed out')
    } else {
      throw new Error('Failed to download image - dlRes is undefined')
    }
  }

  return normalizePath(dlRes.uri)
}
