import {AbortError} from '#/lib/async/cancelable'
import {createVideoEndpointUrl} from '#/lib/media/video/util'
import {MultipartUploadError} from './api'
import {type UploadPartFn} from './types'

export function createUploadPart(
  jobId: string,
  getToken: (forceRefresh?: boolean) => Promise<string>,
): UploadPartFn {
  return async args => {
    try {
      return await sendPart(jobId, await getToken(), args)
    } catch (err) {
      if (
        err instanceof MultipartUploadError &&
        (err.status === 401 || err.error === 'AuthRequired')
      ) {
        args.onProgress(0)
        return await sendPart(jobId, await getToken(true), args)
      }
      throw err
    }
  }
}

function sendPart(
  jobId: string,
  token: string,
  {part, chunk, onProgress, signal}: Parameters<UploadPartFn>[0],
) {
  return new Promise<Awaited<ReturnType<UploadPartFn>>>((resolve, reject) => {
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
