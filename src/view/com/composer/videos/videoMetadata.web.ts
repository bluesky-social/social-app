import {type ImagePickerAsset} from 'expo-image-picker'

export function getVideoMetadata(
  file: File | string,
): Promise<ImagePickerAsset> {
  if (typeof file === 'string')
    throw new Error(
      'getVideoMetadata was passed a uri, when on web it should be a File',
    )
  const blobUrl = URL.createObjectURL(file)

  if (file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          uri: blobUrl,
          file,
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
        URL.revokeObjectURL(blobUrl)
        console.log('Failed to grab GIF metadata', error)
        reject(new Error('Failed to grab GIF metadata'))
      }
      img.src = blobUrl
    })
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = blobUrl

    video.onloadedmetadata = () => {
      resolve({
        uri: blobUrl,
        file,
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
  })
}
