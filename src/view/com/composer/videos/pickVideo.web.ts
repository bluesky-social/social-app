import {type ImagePickerAsset, type ImagePickerResult} from 'expo-image-picker'

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
    let settled = false
    const finish = (result: ImagePickerResult) => {
      if (settled) return
      settled = true
      try {
        document.body.removeChild(input)
      } catch {}
      resolve(result)
    }
    input.addEventListener('change', async () => {
      if (input.files && input.files[0]) {
        finish({
          canceled: false,
          assets: [await getVideoMetadata(input.files[0])],
        })
      } else {
        finish({canceled: true, assets: null})
      }
    })
    input.addEventListener('cancel', () => {
      finish({canceled: true, assets: null})
    })

    const event = new MouseEvent('click')
    input.dispatchEvent(event)
  })
}

// Return an object URL for the picked File so we don't read the whole video
// into a base64 string just to read its width/height/duration.
export function getVideoMetadata(
  file: File | string,
): Promise<ImagePickerAsset> {
  if (typeof file === 'string')
    throw new Error(
      'getVideoMetadata was passed a uri, when on web it should be a File',
    )
  const uri = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      const img = new Image()
      img.onload = () => {
        resolve({
          uri,
          mimeType: 'image/gif',
          width: img.width,
          height: img.height,
          // TODO: real GIF duration (see https://codepen.io/Ryman/pen/nZpYwY); rare in practice.
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
      video.preload = 'metadata'
      video.src = uri
      video.onloadedmetadata = () => {
        resolve({
          uri,
          mimeType: file.type,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration * 1000,
        })
      }
      video.onerror = (_ev, _source, _lineno, _colno, error) => {
        console.log('Failed to grab video metadata', error)
        reject(new Error('Failed to grab video metadata'))
      }
    }
  })
}
