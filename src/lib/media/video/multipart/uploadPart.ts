import {AbortError} from '#/lib/async/cancelable'
import {createVideoEndpointUrl} from '#/lib/media/video/util'
import {MultipartUploadError} from './api'
import {MULTIPART_PART_TIMEOUT_MS} from './constants'
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
    xhr.timeout = MULTIPART_PART_TIMEOUT_MS
    const abort = () => xhr.abort()
    signal.addEventListener('abort', abort, {once: true})
    let settled = false
    const cleanup = () => {
      signal.removeEventListener('abort', abort)
      xhr.onreadystatechange = null
    }
    const rejectOnce = (err: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }
    const resolveOnce = (result: Awaited<ReturnType<UploadPartFn>>) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }

    xhr.upload.addEventListener('progress', event => {
      onProgress(event.loaded)
    })
    xhr.onerror = () => {
      rejectOnce(new TypeError('Network request failed'))
    }
    xhr.ontimeout = () => {
      rejectOnce(new TypeError('Multipart part upload timed out'))
    }
    xhr.onabort = () => {
      rejectOnce(new AbortError())
    }
    xhr.onload = () => {
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
        rejectOnce(
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
        resolveOnce({
          partNumber: data.partNumber ?? part.partNumber,
          sizeBytes: data.sizeBytes ?? part.size,
        })
      }
    }
    xhr.onreadystatechange = () => {
      if (
        xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED &&
        xhr.status >= 400
      ) {
        // React Native does not dispatch `load` until the response body has
        // completed. Reject from the headers so a stalled 5xx response body
        // cannot prevent the retry loop (or eventual abortUpload) from running.
        const status = xhr.status
        rejectOnce(
          new MultipartUploadError(
            `Video service returned ${status}`,
            undefined,
            status,
          ),
        )
        xhr.abort()
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
