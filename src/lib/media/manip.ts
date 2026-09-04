import {Image as RNImage} from 'react-native'
import uuid from 'react-native-uuid'
import {Directory, EncodingType, File, Paths} from 'expo-file-system'
import {SaveFormat} from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library/legacy'
import * as Sharing from 'expo-sharing'

import {logger} from '#/logger'
import {IS_ANDROID, IS_IOS} from '#/env'
import {renderImage} from './image-manipulator'
import {type PickerImage} from './picker.shared'
import {type Dimensions} from './types'
import {convertCdnPreset, getResizedDimensions} from './util'

export async function compressIfNeeded(
  img: PickerImage,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  if (img.size < maxSize) {
    return img
  }
  const resizedImage = await doResize(normalizePath(img.path), {
    maxDimension,
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
  maxDimension: number
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  try {
    new URL(opts.uri)
  } catch (e: any) {
    console.error('Invalid URI', opts.uri, e)
    return
  }

  const path = await downloadImage(opts.uri, String(uuid.v4()), opts.timeout)

  try {
    return await doResize(path, {
      maxDimension: opts.maxDimension,
      maxSize: opts.maxSize,
    })
  } finally {
    safeDelete(path)
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }

  const downloadedPath = await downloadImage(uri, String(uuid.v4()), 15e3)
  let jpegUri: string | undefined
  let imagePath: string | undefined

  try {
    const jpeg = await renderImage(downloadedPath, undefined, {
      format: SaveFormat.JPEG,
      compress: 1.0,
    })
    jpegUri = jpeg.uri
    imagePath = await moveToPermanentPath(jpegUri, '.jpg')
    await Sharing.shareAsync(imagePath, {
      mimeType: 'image/jpeg',
      UTI: 'image/jpeg',
    })
  } finally {
    safeDelete(downloadedPath)
    if (jpegUri) safeDelete(jpegUri)
    if (imagePath) safeDelete(imagePath)
  }
}

const ALBUM_NAME = 'Bluesky'

/**
 * Saves an image to the user's device. Uses the CDN's `download` preset
 * which uses the JPEG version with the Content-Disposition header set to
 * `attachment; filename=<filename>`. On native this saves to the media library;
 * on web it triggers a browser download.
 */
export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  const downloadUri = convertCdnPreset(uri, 'download')
  const downloadedPath = await downloadImage(
    downloadUri,
    String(uuid.v4()),
    20e3,
  )
  const imagePath = await moveToPermanentPath(downloadedPath, '.jpg')

  // save
  try {
    if (IS_ANDROID) {
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
    safeDelete(imagePath)
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
  maxDimension: number
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
  const imageRes = await renderImage(localUri)
  const newDimensions = getResizedDimensions(
    {
      width: imageRes.width,
      height: imageRes.height,
    },
    opts.maxDimension,
  )

  let minQualityPercentage = 0
  let maxQualityPercentage = 101 // exclusive
  let newDataUri: PickerImage | undefined
  const intermediateUris = []

  try {
    while (maxQualityPercentage - minQualityPercentage > 1) {
      const qualityPercentage = Math.round(
        (maxQualityPercentage + minQualityPercentage) / 2,
      )
      const resizeRes = await renderImage(
        localUri,
        context => context.resize(newDimensions),
        {
          format: SaveFormat.JPEG,
          compress: qualityPercentage / 100,
        },
      )

      intermediateUris.push(resizeRes.uri)

      const file = new File(resizeRes.uri)
      if (!file.exists) {
        throw new Error(
          'The image manipulation library failed to create a new image.',
        )
      }

      if (file.size < opts.maxSize) {
        minQualityPercentage = qualityPercentage
        newDataUri = {
          path: normalizePath(resizeRes.uri),
          mime: 'image/jpeg',
          size: file.size,
          width: resizeRes.width,
          height: resizeRes.height,
        }
      } else {
        maxQualityPercentage = qualityPercentage
      }
    }

    if (newDataUri) {
      return newDataUri
    }

    throw new Error(
      `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
    )
  } catch (err) {
    newDataUri = undefined
    throw err
  } finally {
    safeDelete(imageRes.uri)
    for (const intermediateUri of intermediateUris) {
      if (newDataUri?.path !== normalizePath(intermediateUri)) {
        safeDelete(intermediateUri)
      }
    }
  }
}

async function moveToPermanentPath(path: string, ext: string): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()

  const destination = new File(Paths.cache, filename + ext)
  await new File(normalizePath(path)).copy(destination)
  safeDelete(path)
  return normalizePath(destination.uri)
}

export function safeDelete(path: string) {
  const normalizedPath = normalizePath(path)
  try {
    const info = Paths.info(normalizedPath)
    if (info.isDirectory) {
      new Directory(normalizedPath).delete()
    } else if (info.exists) {
      new File(normalizedPath).delete()
    }
  } catch (e) {
    console.error('Failed to delete file', e)
  }
}

function normalizePath(str: string): string {
  if (str.startsWith('/')) {
    return `file://${str}`
  }
  return str
}

export async function saveBytesToDisk(
  filename: string,
  bytes: Uint8Array,
  type: string,
) {
  // ideally we'd use `bytes.toBase64()`, but that's only baseline newly available
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  const encoded = btoa(binary)
  return await saveToDevice(filename, encoded, type)
}

export async function saveToDevice(
  filename: string,
  encoded: string,
  type: string,
) {
  try {
    if (IS_IOS) {
      await withTempFile(filename, encoded, async tmpFileUrl => {
        await Sharing.shareAsync(tmpFileUrl, {UTI: type})
      })
      return true
    } else {
      const directory = await Directory.pickDirectoryAsync()
      const file = directory.createFile(filename, type)
      file.write(encoded, {
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
  // Using a directory so that the file name is not a random string
  const tmpDir = new Directory(Paths.cache, String(uuid.v4()))
  tmpDir.create({intermediates: true})

  try {
    const tmpFile = new File(tmpDir, filename)
    tmpFile.write(encoded, {
      encoding: EncodingType.Base64,
    })

    return await cb(tmpFile.uri)
  } finally {
    safeDelete(tmpDir.uri)
  }
}

async function downloadImage(uri: string, destName: string, timeout: number) {
  /*
   * Download into a temporary directory so Expo can derive a filename from
   * the response headers. We then use that file's MIME type to choose the
   * permanent extension.
   */
  const tempDir = new Directory(Paths.cache, `${destName}-download`)
  tempDir.create({intermediates: true})

  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeout)

  try {
    const downloaded = await File.downloadFileAsync(uri, tempDir, {
      idempotent: true,
      signal: controller.signal,
    })
    const ext = extFromMime(downloaded.type)
    const destination = new File(
      Paths.cache,
      ext ? `${destName}.${ext}` : `${destName}.bin`,
    )
    await downloaded.move(destination)

    return normalizePath(destination.uri)
  } catch (err) {
    if (timedOut) {
      throw new Error('Failed to download image - timed out')
    }

    throw err
  } finally {
    clearTimeout(timeoutId)
    safeDelete(tempDir.uri)
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/gif': 'gif',
}

function extFromMime(mimeType?: string | null): string | undefined {
  return mimeType ? MIME_TO_EXT[mimeType] : undefined
}
