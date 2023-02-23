/// <reference lib="dom" />

import {CropImageModal} from 'state/models/shell-ui'
import {PickerOpts, CameraOpts, CropperOpts, PickedMedia} from './types'
export type {PickedMedia} from './types'
import {RootStoreModel} from 'state/index'
import {
  scaleDownDimensions,
  getImageDim,
  Dim,
  compressIfNeeded,
  moveToPremanantPath,
} from 'lib/media/manip'

interface PickedFile {
  uri: string
  path: string
  size: number
}

export async function openPicker(
  _store: RootStoreModel,
  opts: PickerOpts,
): Promise<PickedMedia[]> {
  const res = await selectFile(opts)
  const dim = await getImageDim(res.uri)
  const mime = extractDataUriMime(res.uri)
  return [
    {
      mediaType: 'photo',
      path: res.uri,
      mime,
      size: res.size,
      width: dim.width,
      height: dim.height,
    },
  ]
}

export async function openCamera(
  _store: RootStoreModel,
  _opts: CameraOpts,
): Promise<PickedMedia> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropper(
  store: RootStoreModel,
  opts: CropperOpts,
): Promise<PickedMedia> {
  // TODO handle more opts
  return new Promise((resolve, reject) => {
    store.shell.openModal(
      new CropImageModal(opts.path, (img?: PickedMedia) => {
        if (img) {
          resolve(img)
        } else {
          reject(new Error('Canceled'))
        }
      }),
    )
  })
}

export async function pickImagesFlow(
  store: RootStoreModel,
  maxFiles: number,
  maxDim: Dim,
  maxSize: number,
) {
  const items = await openPicker(store, {
    multiple: true,
    maxFiles,
    mediaType: 'photo',
  })
  const result = []
  for (const image of items) {
    result.push(
      await cropAndCompressFlow(store, image.path, image, maxDim, maxSize),
    )
  }
  return result
}

export async function cropAndCompressFlow(
  store: RootStoreModel,
  path: string,
  imgDim: Dim,
  maxDim: Dim,
  maxSize: number,
) {
  // choose target dimensions based on the original
  // this causes the photo cropper to start with the full image "selected"
  const {width, height} = scaleDownDimensions(imgDim, maxDim)
  const cropperRes = await openCropper(store, {
    mediaType: 'photo',
    path,
    freeStyleCropEnabled: true,
    width,
    height,
  })

  const img = await compressIfNeeded(cropperRes, maxSize)
  const permanentPath = await moveToPremanantPath(img.path)
  return permanentPath
}

// helpers
// =

function selectFile(opts: PickerOpts): Promise<PickedFile> {
  return new Promise((resolve, reject) => {
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = opts.mediaType === 'photo' ? 'image/*' : '*/*'
    input.onchange = e => {
      const target = e.target as HTMLInputElement
      const file = target?.files?.[0]
      if (!file) {
        return reject(new Error('Canceled'))
      }

      var reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = readerEvent => {
        if (!readerEvent.target) {
          return reject(new Error('Canceled'))
        }
        resolve({
          uri: readerEvent.target.result as string,
          path: file.name,
          size: file.size,
        })
      }
    }
    input.click()
  })
}

function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}
