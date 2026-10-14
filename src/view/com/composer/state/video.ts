import {type ImagePickerAsset} from 'expo-image-picker'
import {type BlobRef, type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {AbortError} from '#/lib/async/cancelable'
import {VIDEO_MAX_SIZE_MB} from '#/lib/constants'
import {compressVideo} from '#/lib/media/video/compress'
import {UploadLimitError, VideoTooLargeError} from '#/lib/media/video/errors'
import {MultipartUploadError} from '#/lib/media/video/multipart/api'
import {type VideoTelemetry} from '#/lib/media/video/telemetry'
import {type CompressedVideo} from '#/lib/media/video/types'
import {uploadVideo} from '#/lib/media/video/upload'
import {createTokenlessVideoServiceClient} from '#/lib/media/video/util'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {app} from '#/lexicons'
import {
  advanceVideoProgress,
  didSkipVideoCompression,
  videoProgressForPhase,
} from './videoProgress'

type CaptionsTrack = {lang: string; file: File}

export type VideoAction =
  | {
      type: 'compressing_to_uploading'
      video: CompressedVideo
      compressionSkipped: boolean
      signal: AbortSignal
    }
  | {
      type: 'uploading_to_processing'
      jobId: string
      signal: AbortSignal
    }
  | {type: 'to_error'; error: string; signal: AbortSignal}
  | {
      type: 'to_done'
      blobRef: BlobRef
      signal: AbortSignal
    }
  | {type: 'update_progress'; progress: number; signal: AbortSignal}
  | {
      type: 'update_alt_text'
      altText: string
      signal: AbortSignal
    }
  | {
      type: 'update_captions'
      updater: (prev: CaptionsTrack[]) => CaptionsTrack[]
      signal: AbortSignal
    }
  | {
      type: 'update_job_status'
      jobStatus: app.bsky.video.defs.JobStatus
      signal: AbortSignal
    }

const noopController = new AbortController()
noopController.abort()

export const NO_VIDEO = Object.freeze({
  status: 'idle',
  progress: 0,
  abortController: noopController,
  asset: undefined,
  video: undefined,
  jobId: undefined,
  pendingPublish: undefined,
  telemetry: undefined,
  altText: '',
  captions: [],
})

export type NoVideoState = typeof NO_VIDEO

type ErrorState = {
  status: 'error'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset | null
  video: CompressedVideo | null
  jobId: string | null
  error: string
  pendingPublish?: undefined
  telemetry: VideoTelemetry
  altText: string
  captions: CaptionsTrack[]
}

type CompressingState = {
  status: 'compressing'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset
  video?: undefined
  jobId?: undefined
  pendingPublish?: undefined
  telemetry: VideoTelemetry
  altText: string
  captions: CaptionsTrack[]
}

type UploadingState = {
  status: 'uploading'
  progress: number
  compressionSkipped: boolean
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish?: undefined
  telemetry: VideoTelemetry
  altText: string
  captions: CaptionsTrack[]
}

type ProcessingState = {
  status: 'processing'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId: string
  jobStatus: app.bsky.video.defs.JobStatus | null
  pendingPublish?: undefined
  telemetry: VideoTelemetry
  altText: string
  captions: CaptionsTrack[]
}

type DoneState = {
  status: 'done'
  progress: 1
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish: {blobRef: BlobRef}
  telemetry: VideoTelemetry
  altText: string
  captions: CaptionsTrack[]
}

export type VideoState =
  ErrorState | CompressingState | UploadingState | ProcessingState | DoneState

export function createVideoState(
  asset: ImagePickerAsset,
  abortController: AbortController,
  telemetry: VideoTelemetry,
): CompressingState {
  return {
    status: 'compressing',
    progress: 0,
    abortController,
    asset,
    telemetry,
    altText: '',
    captions: [],
  }
}

export function videoReducer(
  state: VideoState,
  action: VideoAction,
): VideoState {
  if (action.signal.aborted || action.signal !== state.abortController.signal) {
    // This action is stale and the process that spawned it is no longer relevant.
    return state
  }
  if (action.type === 'to_error') {
    return {
      status: 'error',
      progress: state.progress,
      abortController: state.abortController,
      error: action.error,
      asset: state.asset ?? null,
      video: state.video ?? null,
      jobId: state.jobId ?? null,
      telemetry: state.telemetry,
      altText: state.altText,
      captions: state.captions,
    }
  } else if (action.type === 'update_progress') {
    if (state.status === 'compressing' || state.status === 'uploading') {
      const phase =
        state.status === 'uploading' && state.compressionSkipped
          ? 'uploadingWithoutCompression'
          : state.status
      return {
        ...state,
        progress: advanceVideoProgress(state.progress, phase, action.progress),
      }
    }
  } else if (action.type === 'update_alt_text') {
    return {
      ...state,
      altText: action.altText,
    }
  } else if (action.type === 'update_captions') {
    return {
      ...state,
      captions: action.updater(state.captions),
    }
  } else if (action.type === 'compressing_to_uploading') {
    if (state.status === 'compressing') {
      return {
        status: 'uploading',
        progress: videoProgressForPhase(
          action.compressionSkipped
            ? 'uploadingWithoutCompression'
            : 'uploading',
          0,
        ),
        compressionSkipped: action.compressionSkipped,
        abortController: state.abortController,
        asset: state.asset,
        video: action.video,
        telemetry: state.telemetry,
        altText: state.altText,
        captions: state.captions,
      }
    }
    return state
  } else if (action.type === 'uploading_to_processing') {
    if (state.status === 'uploading') {
      return {
        status: 'processing',
        progress: videoProgressForPhase('processing', 0),
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        jobId: action.jobId,
        jobStatus: null,
        telemetry: state.telemetry,
        altText: state.altText,
        captions: state.captions,
      }
    }
  } else if (action.type === 'update_job_status') {
    if (state.status === 'processing') {
      return {
        ...state,
        jobStatus: action.jobStatus,
        progress:
          action.jobStatus.progress !== undefined
            ? advanceVideoProgress(
                state.progress,
                'processing',
                action.jobStatus.progress / 100,
              )
            : state.progress,
      }
    }
  } else if (action.type === 'to_done') {
    if (state.status === 'processing') {
      return {
        status: 'done',
        progress: 1,
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        pendingPublish: {
          blobRef: action.blobRef,
        },
        telemetry: state.telemetry,
        altText: state.altText,
        captions: state.captions,
      }
    }
  }
  console.error(
    'Unexpected video action (' +
      action.type +
      ') while in ' +
      state.status +
      ' state',
  )
  return state
}

function trunc2dp(num: number) {
  return Math.trunc(num * 100) / 100
}

export async function processVideo(
  asset: ImagePickerAsset,
  dispatch: (action: VideoAction) => void,
  client: Client,
  dispatchUrl: string | URL,
  signal: AbortSignal,
  i18n: I18n,
  telemetry: VideoTelemetry,
) {
  let video: CompressedVideo | undefined
  try {
    telemetry.compressStarted()
    video = await compressVideo(asset, {
      onProgress: num => {
        dispatch({type: 'update_progress', progress: trunc2dp(num), signal})
      },
      signal,
      onProbe: metadata => telemetry.probed(metadata),
    })
  } catch (e) {
    const message = getCompressErrorMessage(e, i18n)
    if (message !== null) {
      telemetry.compressFailed(e)
      dispatch({
        type: 'to_error',
        error: message,
        signal,
      })
    }
    return
  }
  if (video.passthroughReason) {
    telemetry.compressSkipped({
      size: video.size,
      mimeType: video.mimeType,
      skipReason: video.passthroughReason,
    })
  } else {
    telemetry.compressCompleted({size: video.size, mimeType: video.mimeType})
  }
  dispatch({
    type: 'compressing_to_uploading',
    video,
    compressionSkipped: didSkipVideoCompression(video.passthroughReason),
    signal,
  })

  let uploadResponse: app.bsky.video.defs.JobStatus | undefined
  try {
    telemetry.uploadStarted(video.size)
    uploadResponse = await uploadVideo({
      video,
      client,
      dispatchUrl,
      signal,
      i18n,
      setProgress: p => {
        dispatch({type: 'update_progress', progress: p, signal})
      },
    })
  } catch (e) {
    const message = getUploadErrorMessage(e, i18n)
    if (message !== null) {
      telemetry.uploadFailed(e)
      dispatch({
        type: 'to_error',
        error: message,
        signal,
      })
    }
    return
  }

  const jobId = uploadResponse.jobId
  telemetry.uploadCompleted(jobId)
  telemetry.processingStarted(jobId)
  dispatch({
    type: 'uploading_to_processing',
    jobId,
    signal,
  })

  let pollFailures = 0
  while (true) {
    if (signal.aborted) {
      return // Exit async loop
    }

    const videoClient = createTokenlessVideoServiceClient()
    let status: app.bsky.video.defs.JobStatus | undefined
    let blob: BlobRef | undefined
    try {
      const response = await videoClient.call(app.bsky.video.getJobStatus, {
        jobId,
      })
      status = response.jobStatus
      pollFailures = 0

      if (status.state === 'JOB_STATE_COMPLETED') {
        blob = status.blob
        if (!blob) {
          throw new Error('Job completed, but did not return a blob')
        }
      } else if (status.state === 'JOB_STATE_FAILED') {
        throw new Error(status.error ?? 'Job failed to process')
      }
    } catch (e) {
      if (!status) {
        pollFailures++
        if (pollFailures < 50) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue // Continue async loop
        }
      }

      logger.error('Error processing video', {safeMessage: e})
      telemetry.processingFailed(e)
      dispatch({
        type: 'to_error',
        error: getProcessingErrorMessage(
          status?.failureCode,
          status?.error,
          i18n,
        ),
        signal,
      })
      return // Exit async loop
    }

    if (blob) {
      telemetry.processingCompleted()
      dispatch({
        type: 'to_done',
        blobRef: blob,
        signal,
      })
    } else {
      dispatch({
        type: 'update_job_status',
        jobStatus: status,
        signal,
      })
    }

    if (
      status.state !== 'JOB_STATE_COMPLETED' &&
      status.state !== 'JOB_STATE_FAILED'
    ) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      continue // Continue async loop
    }

    return // Exit async loop
  }
}

function getProcessingErrorMessage(
  failureCode: string | undefined,
  error: string | undefined,
  i18n: I18n,
) {
  const validationError = getValidationErrorMessage(error, i18n)
  if (failureCode === 'validation_failure') {
    return (
      validationError ?? i18n._(msg`The selected video could not be processed.`)
    )
  }
  // Support workers deployed before failureCode was added.
  if (!failureCode && validationError) {
    return validationError
  }

  switch (failureCode) {
    case 'encoding_failure':
      return i18n._(msg`The selected video could not be encoded.`)
    case 'pds_upload_failure':
      return i18n._(
        msg`The video could not be uploaded to your hosting provider. Please try again.`,
      )
    case 'pds_upload_unsupported_blob_size':
      return i18n._(
        msg`Your hosting provider does not support videos this large. Please try again with a smaller file.`,
      )
    case 'generic_failure':
    default:
      return i18n._(msg`Video failed to process`)
  }
}

function getValidationErrorMessage(error: string | undefined, i18n: I18n) {
  switch (error) {
    case 'video_too_long':
      return i18n._(msg`The selected video is too long.`)
    case 'bad_aspect_ratio':
      return i18n._(msg`The selected video has an unsupported aspect ratio.`)
    case 'unsupported_codec':
      return i18n._(msg`The selected video uses an unsupported format.`)
    case 'encoded_video_too_large':
      return i18n._(
        msg`The processed video is too large. Please try again with a smaller file.`,
      )
  }
}

function getCompressErrorMessage(e: unknown, i18n: I18n): string | null {
  if (e instanceof AbortError) {
    return null
  }
  if (e instanceof VideoTooLargeError) {
    return i18n._(
      msg`The selected video is larger than ${VIDEO_MAX_SIZE_MB} MB. Please try again with a smaller file.`,
    )
  }
  logger.error('Error compressing video', {safeMessage: e})
  return i18n._(msg`An error occurred while compressing the video.`)
}

function getUploadErrorMessage(e: unknown, i18n: I18n): string | null {
  if (e instanceof AbortError) {
    return null
  }
  if (e instanceof MultipartUploadError || e instanceof UploadLimitError) {
    // https://github.com/bluesky-social/tango/blob/lumi/lumi/worker/permissions.go#L77
    switch (e.message) {
      case 'User is not allowed to upload videos':
        return i18n._(msg`You are not allowed to upload videos.`)
      case 'Uploading is disabled at the moment':
        return i18n._(
          msg`Hold up! We’re gradually giving access to video, and you’re still waiting in line. Check back soon!`,
        )
      case "Failed to get user's upload stats":
        return i18n._(
          msg`We were unable to determine if you are allowed to upload videos. Please try again.`,
        )
      case 'User has exceeded daily upload bytes limit':
        return i18n._(
          msg`You've reached your daily limit for video uploads (too many bytes)`,
        )
      case 'User has exceeded daily upload videos limit':
        return i18n._(
          msg`You've reached your daily limit for video uploads (too many videos)`,
        )
      case 'Account is not old enough to upload videos':
        return i18n._(
          msg`Your account is not yet old enough to upload videos. Please try again later.`,
        )
      case 'file size (100000001 bytes) is larger than the maximum allowed size (100000000 bytes)':
      case 'file size (300000001 bytes) is larger than the maximum allowed size (300000000 bytes)':
        return i18n._(
          msg`The selected video is larger than ${VIDEO_MAX_SIZE_MB} MB. Please try again with a smaller file.`,
        )
      case 'Confirm your email address to upload videos':
        return i18n._(msg`Please confirm your email address to upload videos.`)
    }
  }

  if (isNetworkError(e)) {
    return i18n._(
      msg`An error occurred while uploading the video. Please check your internet connection and try again.`,
    )
  } else {
    // only log errors if they are unknown (and not network errors)
    logger.error('Error uploading video', {safeMessage: e})
  }

  const message = e instanceof Error ? e.message : ''
  return i18n._(msg`An error occurred while uploading the video. ${message}`)
}
