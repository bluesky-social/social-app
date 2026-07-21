import {AbortError} from '#/lib/async/cancelable'
import {createVideoEndpointUrl} from '#/lib/media/video/util'
import {MultipartUploadError} from './api'
import {type UploadPartFn} from './types'

export function createUploadPart(jobId: string, token: string): UploadPartFn {
  return ({part, chunk, onProgress, signal}) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new AbortError())
        return
      }
      const xhr = new XMLHttpRequest()
      const abort = () => xhr.abort()
      signal.addEventListener('abort', abort, {once: true})
      const cleanup = () => signal.removeEventListener('abort', abort)

      xhr.upload.addEventListener('progress', event => {
        onProgress(event.loaded)
      })
      xhr.onerror = () => {
        cleanup()
        reject(new TypeError('Network request failed'))
      }
      xhr.onabort = () => {
        cleanup()
        reject(new AbortError())
      }
      xhr.onload = () => {
        cleanup()
        let data: {
          partNumber?: number
          sizeBytes?: number
          error?: string
          message?: string
        }
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          data = {}
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new MultipartUploadError(
              data.message ||
                data.error ||
                `Video service returned ${xhr.status}`,
              data.error,
              xhr.status,
            ),
          )
        } else {
          onProgress(part.size)
          resolve({
            partNumber: data.partNumber ?? part.partNumber,
            sizeBytes: data.sizeBytes ?? part.size,
          })
        }
      }
      xhr.open(
        'POST',
        createVideoEndpointUrl('/xrpc/app.bsky.video.uploadPart', {
          jobId,
          partNumber: String(part.partNumber),
        }),
      )
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(chunk as XMLHttpRequestBodyInit)
    })
}
