import {AbortError} from '#/lib/async/cancelable'
import {createVideoEndpointUrl} from '#/lib/media/video/util'
import {
  type AbortUploadResponse,
  type FinishUploadResponse,
  type StartUploadResponse,
  type UploadStatusResponse,
} from './types'

export class MultipartUploadError extends Error {
  constructor(
    message: string,
    public error?: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'MultipartUploadError'
  }
}

async function request<T>({
  route,
  token,
  signal,
  method = 'POST',
  body,
  params,
}: {
  route: string
  token: string
  signal?: AbortSignal
  method?: 'GET' | 'POST'
  body?: object
  params?: Record<string, string>
}): Promise<T> {
  if (signal?.aborted) throw new AbortError()
  let res: Response
  try {
    res = await fetch(createVideoEndpointUrl(route, params), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? {'Content-Type': 'application/json'} : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (signal?.aborted) throw new AbortError()
    throw err
  }
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {}
  if (!res.ok) {
    const xrpc = data as {error?: string; message?: string} | undefined
    throw new MultipartUploadError(
      xrpc?.message || xrpc?.error || `Video service returned ${res.status}`,
      xrpc?.error,
      res.status,
    )
  }
  return data as T
}

export function startUpload({
  token,
  video,
  name,
  signal,
}: {
  token: string
  video: {size: number; mimeType: string}
  name: string
  signal: AbortSignal
}) {
  return request<StartUploadResponse>({
    route: '/xrpc/app.bsky.video.startUpload',
    token,
    signal,
    body: {sizeBytes: video.size, mimeType: video.mimeType, name},
  })
}

export function finishUpload(
  jobId: string,
  token: string,
  signal: AbortSignal,
) {
  return request<FinishUploadResponse>({
    route: '/xrpc/app.bsky.video.finishUpload',
    token,
    signal,
    body: {jobId},
  })
}

export function getUploadStatus(
  jobId: string,
  token: string,
  signal?: AbortSignal,
) {
  return request<UploadStatusResponse>({
    route: '/xrpc/app.bsky.video.getUploadStatus',
    token,
    signal,
    method: 'GET',
    params: {jobId},
  })
}

export function abortUpload(jobId: string, token: string) {
  return request<AbortUploadResponse>({
    route: '/xrpc/app.bsky.video.abortUpload',
    token,
    body: {jobId},
  })
}

export function completedStatus(status: UploadStatusResponse) {
  if (
    status.state !== 'completed' ||
    !status.completedJobId ||
    !status.jobStatus
  ) {
    return undefined
  }
  return {
    completedJobId: status.completedJobId,
    jobStatus: status.jobStatus,
  }
}
