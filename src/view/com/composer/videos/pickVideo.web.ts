import {ImagePickerAsset, ImagePickerResult} from 'expo-image-picker'

import {SUPPORTED_MIME_TYPES} from '#/lib/constants'

// mostly copied from expo-image-picker and adapted to support gifs
// also adds support for reading video metadata

export async function pickVideo(): Promise<ImagePickerResult> {
  const input = document.createElement('input')
  input.style.display = 'none'
  input.setAttribute('type', 'file')
  // TODO: do we need video/* here? -sfn
  input.setAttribute('accept', SUPPORTED_MIME_TYPES.join(','))
  input.setAttribute('id', String(Math.random()))

  document.body.appendChild(input)

  return new Promise(resolve => {
    input.addEventListener('change', async () => {
      if (input.files) {
        const file = input.files[0]
        resolve({
          canceled: false,
          assets: [await getVideoMetadata(file)],
        })
      } else {
        resolve({canceled: true, assets: null})
      }
      document.body.removeChild(input)
    })

    const event = new MouseEvent('click')
    input.dispatchEvent(event)
  })
}

// TODO: we're converting to a dataUrl here, and then converting back to an
// ArrayBuffer in the compressVideo function. This is a bit wasteful, but it
// lets us use the ImagePickerAsset type, which the rest of the code expects.
// We should unwind this and just pass the ArrayBuffer/objectUrl through the system
// instead of a string -sfn
export const getVideoMetadata = (file: File): Promise<ImagePickerAsset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const uri = reader.result as string

      if (file.type === 'image/gif') {
        const img = new Image()
        img.onload = () => {
          resolve({
            uri,
            mimeType: 'image/gif',
            width: img.width,
            height: img.height,
            // todo: calculate gif duration. seems possible if you read the bytes
            // https://codepen.io/Ryman/pen/nZpYwY
            // for now let's just let the server reject it, since that seems uncommon -sfn
            duration: null,
          })
        }
        img.onerror = (_ev, _source, _lineno, _colno, error) => {
          console.log('Failed to grab GIF metadata', error)
          reject(new Error('Failed to grab GIF metadata'))
        }
        img.src = uri
      } else {
        const video = document.createElement('video')
        const blobUrl = URL.createObjectURL(file)

        video.preload = 'metadata'
        video.src = blobUrl

        video.onloadedmetadata = () => {
          URL.revokeObjectURL(blobUrl)
          resolve({
            uri,
            mimeType: file.type,
            width: video.videoWidth,
            height: video.videoHeight,
            // convert seconds to ms
            duration: video.duration * 1000,
          })
        }
        video.onerror = (_ev, _source, _lineno, _colno, error) => {
          URL.revokeObjectURL(blobUrl)
          console.log('Failed to grab video metadata', error)
          reject(new Error('Failed to grab video metadata'))
        }
      }
    }
    reader.readAsDataURL(file)
  })
}
