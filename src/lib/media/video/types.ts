export interface JobStatus {
  jobId: string
  did: string
  cid: string
  state: JobState
  progress?: number
  errorHuman?: string
  errorMachine?: string
}

export enum JobState {
  JOB_STATE_UNSPECIFIED,
  JOB_STATE_CREATED,
  JOB_STATE_ENCODING,
  JOB_STATE_ENCODED,
  JOB_STATE_UPLOADING,
  JOB_STATE_UPLOADED,
  JOB_STATE_CDN_PROCESSING,
  JOB_STATE_CDN_PROCESSED,
  JOB_STATE_FAILED,
  JOB_STATE_COMPLETED,
}

export interface UploadVideoResponse {
  job_id: string
  did: string
  cid: string
  state: JobState
}
