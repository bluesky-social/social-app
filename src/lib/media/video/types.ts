/**
 * TEMPORARY: THIS IS A TEMPORARY PLACEHOLDER. THAT MEANS IT IS TEMPORARY. I.E. WILL BE REMOVED. NOT TO USE IN PRODUCTION.
 * @temporary
 * PS: This is a temporary placeholder for the video types. It will be removed once the actual types are implemented.
 * Not joking, this is temporary.
 */

export interface JobStatus {
  job_id: string
  did: string
  cid: string
  encoded_cid: string
  encoded_mime_type: string
  encoded_size_bytes: number
  state: JobState
  progress?: number
  error_human?: string
  error_machine?: string
}

export enum JobState {
  JOB_STATE_UNSPECIFIED = 'JOB_STATE_UNSPECIFIED',
  JOB_STATE_CREATED = 'JOB_STATE_CREATED',
  JOB_STATE_ENCODING = 'JOB_STATE_ENCODING',
  JOB_STATE_ENCODED = 'JOB_STATE_ENCODED',
  JOB_STATE_UPLOADING = 'JOB_STATE_UPLOADING',
  JOB_STATE_UPLOADED = 'JOB_STATE_UPLOADED',
  JOB_STATE_CDN_PROCESSING = 'JOB_STATE_CDN_PROCESSING',
  JOB_STATE_CDN_PROCESSED = 'JOB_STATE_CDN_PROCESSED',
  JOB_STATE_FAILED = 'JOB_STATE_FAILED',
  JOB_STATE_COMPLETED = 'JOB_STATE_COMPLETED',
}

export interface UploadVideoResponse {
  job_id: string
  did: string
  cid: string
  state: JobState
}
