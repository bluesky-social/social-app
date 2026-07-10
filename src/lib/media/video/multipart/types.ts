/**
 * One part of a multipart upload. `partNumber` is 1-indexed to match the S3
 * convention the backend uses.
 */
export type PartPlan = {
  partNumber: number
  offset: number
  size: number
}

/**
 * Result of uploading a single part. `etag` is the value the storage backend
 * (R2) returns for the part; the complete request lists these back to assemble
 * the object.
 */
export type PartUploadResult = {
  partNumber: number
  etag: string
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
 * Uploads one part to storage and resolves with its ETag. This is the only
 * protocol-specific seam - for the presigned R2 approach it does a direct PUT
 * to the presigned URL and reads the ETag off the response. Injected into the
 * orchestrator so the transport can be filled in once the backend lands.
 */
export type UploadPartFn = (args: {
  part: PartPlan
  chunk: Uint8Array
  onProgress: (bytesSent: number) => void
  signal: AbortSignal
}) => Promise<PartUploadResult>
