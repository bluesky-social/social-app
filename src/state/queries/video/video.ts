import React, {useCallback} from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {AppBskyVideoDefs, BlobRef, BskyAgent} from '@atproto/api'
import {JobStatus} from '@atproto/api/dist/client/types/app/bsky/video/defs'
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AbortError} from '#/lib/async/cancelable'
import {SUPPORTED_MIME_TYPES, SupportedMimeTypes} from '#/lib/constants'
import {compressVideo} from '#/lib/media/video/compress'
import {
  ServerError,
  UploadLimitError,
  VideoTooLargeError,
} from '#/lib/media/video/errors'
import {CompressedVideo} from '#/lib/media/video/types'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {createVideoAgent} from '#/state/queries/video/util'
import {uploadVideo} from '#/state/queries/video/video-upload'
import {useAgent, useSession} from '#/state/session'

type Action =
  | {type: 'SetProcessing'; jobId: string}
  | {type: 'SetProgress'; progress: number}
  | {type: 'SetError'; error: string}
  | {type: 'Reset'}
  | {type: 'SetAsset'; asset: ImagePickerAsset}
  | {type: 'SetDimensions'; width: number; height: number}
  | {type: 'SetVideo'; video: CompressedVideo}
  | {type: 'SetJobStatus'; jobStatus: AppBskyVideoDefs.JobStatus}
  | {type: 'SetComplete'; blobRef: BlobRef}

type IdleState = {
  status: 'idle'
  progress: 0
  abortController: AbortController
  asset?: undefined
  video?: undefined
  jobId?: undefined
  pendingPublish?: undefined
}

type ErrorState = {
  status: 'error'
  progress: 100
  abortController: AbortController
  asset?: undefined
  video?: undefined
  jobId: string | null
  error: string
  pendingPublish?: undefined
}

type CompressingState = {
  status: 'compressing'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset
  video?: undefined
  jobId?: undefined
  pendingPublish?: undefined
}

type UploadingState = {
  status: 'uploading'
  progress: number
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish?: undefined
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
}

type DoneState = {
  status: 'done'
  progress: 100
  abortController: AbortController
  asset: ImagePickerAsset
  video: CompressedVideo
  jobId?: undefined
  pendingPublish: {blobRef: BlobRef; mutableProcessed: boolean}
}

export type State =
  | IdleState
  | ErrorState
  | CompressingState
  | UploadingState
  | ProcessingState
  | DoneState

function createInitialState(): IdleState {
  return {
    status: 'idle',
    progress: 0,
    abortController: new AbortController(),
  }
}

function reducer(state: State, action: Action): State {
  if (action.type === 'Reset') {
    return createInitialState()
  } else if (action.type === 'SetError') {
    return {
      status: 'error',
      progress: 100,
      abortController: state.abortController,
      error: action.error,
      jobId: state.status === 'processing' ? state.jobId : null,
    }
  } else if (action.type === 'SetProgress') {
    if (state.status === 'compressing' || state.status === 'uploading') {
      return {
        ...state,
        progress: action.progress,
      }
    }
  } else if (action.type === 'SetAsset') {
    if (state.status === 'idle') {
      return {
        status: 'compressing',
        progress: 0,
        abortController: state.abortController,
        asset: action.asset,
      }
    }
  } else if (action.type === 'SetDimensions') {
    if (state.asset) {
      return {
        ...state,
        asset: {...state.asset, width: action.width, height: action.height},
      }
    }
  } else if (action.type === 'SetVideo') {
    if (state.status === 'compressing') {
      return {
        status: 'uploading',
        progress: 0,
        abortController: state.abortController,
        asset: state.asset,
        video: action.video,
      }
    }
    return state
  } else if (action.type === 'SetProcessing') {
    if (state.status === 'uploading') {
      return {
        status: 'processing',
        progress: 0,
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        jobId: action.jobId,
        jobStatus: null,
      }
    }
  } else if (action.type === 'SetJobStatus') {
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
  } else if (action.type === 'SetComplete') {
    if (state.status === 'processing') {
      return {
        status: 'done',
        progress: 100,
        abortController: state.abortController,
        asset: state.asset,
        video: state.video,
        pendingPublish: {
          blobRef: action.blobRef,
          mutableProcessed: false,
        },
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

export function useUploadVideo() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {_} = useLingui()
  const [state, dispatch] = React.useReducer(reducer, null, createInitialState)

  const did = currentAccount!.did
  const selectVideo = React.useCallback(
    (asset: ImagePickerAsset) => {
      const signal = state.abortController.signal
      function guardedDispatch(action: Action) {
        if (!signal.aborted) {
          dispatch(action)
        }
      }
      processVideo(
        asset,
        guardedDispatch,
        agent,
        did,
        state.abortController.signal,
        _,
      )
    },
    [_, state.abortController, dispatch, agent, did],
  )

  const clearVideo = () => {
    state.abortController.abort()
    dispatch({type: 'Reset'})
  }

  const updateVideoDimensions = useCallback((width: number, height: number) => {
    dispatch({
      type: 'SetDimensions',
      width,
      height,
    })
  }, [])

  return {
    state,
    selectVideo,
    clearVideo,
    updateVideoDimensions,
  }
}

function getMimeType(asset: ImagePickerAsset) {
  if (isWeb) {
    const [mimeType] = asset.uri.slice('data:'.length).split(';base64,')
    if (!mimeType) {
      throw new Error('Could not determine mime type')
    }
    return mimeType
  }
  if (!asset.mimeType) {
    throw new Error('Could not determine mime type')
  }
  return asset.mimeType
}

function trunc2dp(num: number) {
  return Math.trunc(num * 100) / 100
}

async function processVideo(
  asset: ImagePickerAsset,
  dispatch: (action: Action) => void,
  agent: BskyAgent,
  did: string,
  signal: AbortSignal,
  _: I18n['_'],
) {
  // compression step on native converts to mp4, so no need to check there
  if (isWeb) {
    const mimeType = getMimeType(asset)
    if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeTypes)) {
      throw new Error(_(msg`Unsupported video type: ${mimeType}`))
    }
  }

  dispatch({
    type: 'SetAsset',
    asset,
  })

  let video: CompressedVideo | undefined
  try {
    video = await compressVideo(asset, {
      onProgress: num => {
        dispatch({type: 'SetProgress', progress: trunc2dp(num)})
      },
      signal,
    })
  } catch (e) {
    const message = getCompressErrorMessage(e, _)
    if (message !== null) {
      dispatch({
        type: 'SetError',
        error: message,
      })
    }
    return
  }
  dispatch({
    type: 'SetVideo',
    video,
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
        dispatch({type: 'SetProgress', progress: p})
      },
    })
  } catch (e) {
    const message = getUploadErrorMessage(e, _)
    if (message !== null) {
      dispatch({
        type: 'SetError',
        error: message,
      })
    }
    return
  }

  const jobId = uploadResponse.jobId
  dispatch({
    type: 'SetProcessing',
    jobId,
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
        type: 'SetError',
        error: _(msg`Video failed to process`),
      })
      return // Exit async loop
    }

    if (blob) {
      dispatch({
        type: 'SetComplete',
        blobRef: blob,
      })
    } else {
      dispatch({
        type: 'SetJobStatus',
        jobStatus: status,
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
    return _(msg`The selected video is larger than 50MB.`)
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
