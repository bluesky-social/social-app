/**
 * One part of a multipart upload. `partNumber` is 1-indexed to match the S3
 * convention the backend uses.
 */
export type PartPlan = {
  partNumber: number
  offset: number
  size: number
}

/** Receipt returned by the video service after recording a part. */
export type PartUploadResult = {
  partNumber: number
  sizeBytes: number
}

/**
 * Reads a byte range off the compressed video. Native opens a file handle and
 * seeks; web slices an in-memory buffer. `close` releases the native handle and
 * is a no-op on web.
 */
export type ChunkReader = {
  read: (offset: number, size: number) => Promise<Uint8Array>
  close: () => void
}

/**
 * Uploads one part through the video service's first-party proxy.
 */
export type UploadPartFn = (args: {
  part: PartPlan
  chunk: Uint8Array
  onProgress: (bytesSent: number) => void
  signal: AbortSignal
}) => Promise<PartUploadResult>

export type StartUploadResponse = {
  jobId: string
  partSizeBytes: number
  partCount: number
  expiresAt: string
}

export type UploadState =
  | 'created'
  | 'finishing'
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'expired'

export type UploadStatusResponse = {
  jobId: string
  partSizeBytes: number
  partCount: number
  receivedParts: number[]
  expiresAt: string
  state: UploadState
  completedJobId?: string
  jobStatus?: import('@atproto/api').AppBskyVideoDefs.JobStatus
  failureReason?: string
}

export type FinishUploadResponse = {
  completedJobId: string
  jobStatus: import('@atproto/api').AppBskyVideoDefs.JobStatus
}

export type AbortUploadResponse = Pick<
  UploadStatusResponse,
  'completedJobId' | 'failureReason'
> & {state: 'aborted' | 'completed' | 'failed' | 'expired'}
