import {ImagePickerAsset} from 'expo-image-picker'
import {AppBskyVideoDefs, BlobRef, BskyAgent} from '@atproto/api'
import {JobStatus} from '@atproto/api/dist/client/types/app/bsky/video/defs'
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'

import {AbortError} from '#/lib/async/cancelable'
import {compressVideo} from '#/lib/media/video/compress'
import {
  ServerError,
  UploadLimitError,
  VideoTooLargeError,
} from '#/lib/media/video/errors'
import {CompressedVideo} from '#/lib/media/video/types'
import {uploadVideo} from '#/lib/media/video/upload'
import {createVideoAgent} from '#/lib/media/video/util'
import {logger} from '#/logger'

type CaptionsTrack = {lang: string; file: File}

export type VideoAction =
  | {
      type: 'compressing_to_uploading'
      video: CompressedVideo
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
      jobStatus: AppBskyVideoDefs.JobStatus
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
  altText: '',
  captions: [],
})

export type NoVideoState = typeof NO_VIDEO

type ErrorState = {
  status: 'error'
  progress: 100
  abortController: AbortController
  asset: ImagePickerAsset | null
  video: CompressedVideo | null
  jobId: string | null
  error: string
  pendingPublish?: undefined
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
  altText: string
  captions: CaptionsTrack[]
}

type UploadingState = {
  status: 'uploading'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish?: undefined
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
  jobStatus: AppBskyVideoDefs.JobStatus | null
  pendingPublish?: undefined
  altText: string
  captions: CaptionsTrack[]
}

type DoneState = {
  status: 'done'
  progress: 100
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish: {blobRef: BlobRef}
  altText: string
  captions: CaptionsTrack[]
}

export type VideoState =
  | ErrorState
  | CompressingState
  | UploadingState
  | ProcessingState
  | DoneState

export function createVideoState(
  asset: ImagePickerAsset,
  abortController: AbortController,
): CompressingState {
  return {
    status: 'compressing',
    progress: 0,
    abortController,
    asset,
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
      progress: 100,
      abortController: state.abortController,
      error: action.error,
      asset: state.asset ?? null,
      video: state.video ?? null,
      jobId: state.jobId ?? null,
      altText: state.altText,
      captions: state.captions,
    }
  } else if (action.type === 'update_progress') {
    if (state.status === 'compressing' || state.status === 'uploading') {
      return {
        ...state,
        progress: action.progress,
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
        progress: 0,
        abortController: state.abortController,
        asset: state.asset,
        video: action.video,
        altText: state.altText,
        captions: state.captions,
      }
    }
    return state
  } else if (action.type === 'uploading_to_processing') {
    if (state.status === 'uploading') {
      return {
        status: 'processing',
        progress: 0,
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        jobId: action.jobId,
        jobStatus: null,
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
            ? action.jobStatus.progress / 100
            : state.progress,
      }
    }
  } else if (action.type === 'to_done') {
    if (state.status === 'processing') {
      return {
        status: 'done',
        progress: 100,
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        pendingPublish: {
          blobRef: action.blobRef,
        },
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
  agent: BskyAgent,
  did: string,
  signal: AbortSignal,
  _: I18n['_'],
) {
  let video: CompressedVideo | undefined
  try {
    video = await compressVideo(asset, {
      onProgress: num => {
        dispatch({type: 'update_progress', progress: trunc2dp(num), signal})
      },
      signal,
    })
  } catch (e) {
    const message = getCompressErrorMessage(e, _)
    if (message !== null) {
      dispatch({
        type: 'to_error',
        error: message,
        signal,
      })
    }
    return
  }
  dispatch({
    type: 'compressing_to_uploading',
    video,
    signal,
  })

  let uploadResponse: AppBskyVideoDefs.JobStatus | undefined
  try {
    uploadResponse = await uploadVideo({
      video,
      agent,
      did,
      signal,
      _,
      setProgress: p => {
        dispatch({type: 'update_progress', progress: p, signal})
      },
    })
  } catch (e) {
    const message = getUploadErrorMessage(e, _)
    if (message !== null) {
      dispatch({
        type: 'to_error',
        error: message,
        signal,
      })
    }
    return
  }

  const jobId = uploadResponse.jobId
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

    const videoAgent = createVideoAgent()
    let status: JobStatus | undefined
    let blob: BlobRef | undefined
    try {
      const response = await videoAgent.app.bsky.video.getJobStatus({jobId})
      status = response.data.jobStatus
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
      dispatch({
        type: 'to_error',
        error: _(msg`Video failed to process`),
        signal,
      })
      return // Exit async loop
    }

    if (blob) {
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

function getCompressErrorMessage(e: unknown, _: I18n['_']): string | null {
  if (e instanceof AbortError) {
    return null
  }
  if (e instanceof VideoTooLargeError) {
    return _(msg`The selected video is larger than 100 MB.`)
  }
  logger.error('Error compressing video', {safeMessage: e})
  return _(msg`An error occurred while compressing the video.`)
}

function getUploadErrorMessage(e: unknown, _: I18n['_']): string | null {
  if (e instanceof AbortError) {
    return null
  }
  logger.error('Error uploading video', {safeMessage: e})
  if (e instanceof ServerError || e instanceof UploadLimitError) {
    // https://github.com/bluesky-social/tango/blob/lumi/lumi/worker/permissions.go#L77
    switch (e.message) {
      case 'User is not allowed to upload videos':
        return _(msg`You are not allowed to upload videos.`)
      case 'Uploading is disabled at the moment':
        return _(
          msg`Hold up! We’re gradually giving access to video, and you’re still waiting in line. Check back soon!`,
        )
      case "Failed to get user's upload stats":
        return _(
          msg`We were unable to determine if you are allowed to upload videos. Please try again.`,
        )
      case 'User has exceeded daily upload bytes limit':
        return _(
          msg`You've reached your daily limit for video uploads (too many bytes)`,
        )
      case 'User has exceeded daily upload videos limit':
        return _(
          msg`You've reached your daily limit for video uploads (too many videos)`,
        )
      case 'Account is not old enough to upload videos':
        return _(
          msg`Your account is not yet old enough to upload videos. Please try again later.`,
        )
      default:
        return e.message
    }
  }
  return _(msg`An error occurred while uploading the video.`)
}
