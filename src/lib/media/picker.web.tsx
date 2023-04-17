/// <reference lib="dom" />

import {PickerOpts, CameraOpts, CropperOptions} from './types'
import {RootStoreModel} from 'state/index'
import {getImageDim} from 'lib/media/manip'
import {extractDataUriMime} from './util'
import {Image as RNImage} from 'react-native-image-crop-picker'

interface PickedFile {
  uri: string
  path: string
  size: number
}

export async function openPicker(
  _store: RootStoreModel,
  opts: PickerOpts,
): Promise<RNImage[]> {
  const res = await selectFile(opts)
  const dim = await getImageDim(res.uri)
  const mime = extractDataUriMime(res.uri)
  return [
    {
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
): Promise<RNImage> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropper(
  store: RootStoreModel,
  opts: CropperOptions,
): Promise<RNImage> {
  // TODO handle more opts
  return new Promise((resolve, reject) => {
    store.shell.openModal({
      name: 'crop-image',
      uri: opts.path,
      onSelect: (img?: RNImage) => {
        if (img) {
          resolve(img)
        } else {
          reject(new Error('Canceled'))
        }
      },
    })
  })
}

/**
 * Opens the select file dialog in the browser.
 * NOTE:
 * If in the future someone updates this method to use:
 * https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker
 * Check that the `showOpenFilePicker` API does not require any permissions
 * granted to use. As of this writing, it does not, but that could change
 * in the future. If the user does need to go through a permissions granting
 * flow, then checkout the usePhotoLibraryPermission() hook in
 *   src/lib/hooks/usePermissions.ts
 * so that it gets appropriately updated.
 */
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
