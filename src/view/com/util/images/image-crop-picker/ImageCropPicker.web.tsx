/// <reference lib="dom" />

import {CropImageModal} from 'state/models/shell-ui'
import {PickerOpts, CameraOpts, CropperOpts, PickedMedia} from './types'
export type {PickedMedia} from './types'
import {RootStoreModel} from 'state/index'

interface PickedFile {
  uri: string
  path: string
  size: number
}

export async function openPicker(
  store: RootStoreModel,
  opts: PickerOpts,
): Promise<PickedMedia[] | PickedMedia> {
  const res = await selectFile(opts)
  return new Promise((resolve, reject) => {
    store.shell.openModal(
      new CropImageModal(res.uri, (img?: PickedMedia) => {
        if (img) {
          resolve(img)
        } else {
          reject(new Error('Canceled'))
        }
      }),
    )
  })
}

export async function openCamera(
  _store: RootStoreModel,
  _opts: CameraOpts,
): Promise<PickedMedia> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropper(
  _store: RootStoreModel,
  _opts: CropperOpts,
): Promise<PickedMedia> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

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
