import React, {useCallback, useEffect} from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {AppBskyVideoDefs, BlobRef} from '@atproto/api'
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

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

type Status = 'idle' | 'compressing' | 'processing' | 'uploading' | 'done'

type Action =
  | {type: 'SetProcessing'; jobId: string}
  | {type: 'SetProgress'; progress: number}
  | {type: 'SetError'; error: string | undefined}
  | {type: 'Reset'}
  | {type: 'SetAsset'; asset: ImagePickerAsset}
  | {type: 'SetDimensions'; width: number; height: number}
  | {type: 'SetVideo'; video: CompressedVideo}
  | {type: 'SetJobStatus'; jobStatus: AppBskyVideoDefs.JobStatus}
  | {type: 'SetComplete'; blobRef: BlobRef}

export interface State {
  status: Status
  progress: number
  asset?: ImagePickerAsset
  video: CompressedVideo | null
  jobId?: string
  jobStatus?: AppBskyVideoDefs.JobStatus
  error?: string
  abortController: AbortController
  pendingPublish?: {blobRef: BlobRef; mutableProcessed: boolean}
}

function reducer(state: State, action: Action): State {
  let updatedState = state
  if (action.type === 'SetProcessing') {
    updatedState = {...state, status: 'processing', jobId: action.jobId}
  } else if (action.type === 'SetProgress') {
    updatedState = {...state, progress: action.progress}
  } else if (action.type === 'SetError') {
    updatedState = {...state, error: action.error}
  } else if (action.type === 'Reset') {
    updatedState = {
      status: 'idle',
      progress: 0,
      video: null,
      abortController: new AbortController(),
    }
  } else if (action.type === 'SetAsset') {
    updatedState = {
      ...state,
      asset: action.asset,
      status: 'compressing',
      error: undefined,
    }
  } else if (action.type === 'SetDimensions') {
    updatedState = {
      ...state,
      asset: state.asset
        ? {...state.asset, width: action.width, height: action.height}
        : undefined,
    }
  } else if (action.type === 'SetVideo') {
    updatedState = {...state, video: action.video, status: 'uploading'}
  } else if (action.type === 'SetJobStatus') {
    updatedState = {...state, jobStatus: action.jobStatus}
  } else if (action.type === 'SetComplete') {
    updatedState = {
      ...state,
      pendingPublish: {
        blobRef: action.blobRef,
        mutableProcessed: false,
      },
      status: 'done',
    }
  }
  return updatedState
}

function RQKEY(jobId: string | undefined) {
  return ['video-status', jobId || '']
}

export function useUploadVideo({
  setStatus,
  initialVideoUri,
}: {
  setStatus: (status: string) => void
  onSuccess: () => void
  initialVideoUri?: string
}) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const [state, dispatch] = React.useReducer(reducer, {
    status: 'idle',
    progress: 0,
    video: null,
    abortController: new AbortController(),
  })

  useUploadStatusQuery({
    jobId: state.jobId,
    onStatusChange: (status: AppBskyVideoDefs.JobStatus) => {
      // This might prove unuseful, most of the job status steps happen too quickly to even be displayed to the user
      // Leaving it for now though
      dispatch({
        type: 'SetJobStatus',
        jobStatus: status,
      })
      setStatus(status.state.toString())
    },
    onSuccess: blobRef => {
      dispatch({
        type: 'SetComplete',
        blobRef,
      })
    },
    onError: useCallback(
      error => {
        logger.error('Error processing video', {safeMessage: error})
        dispatch({
          type: 'SetError',
          error: _(msg`Video failed to process`),
        })
      },
      [_],
    ),
  })

  const did = currentAccount!.did
  const onVideoCompressed = useCallback(
    (video: CompressedVideo) => {
      const signal = state.abortController.signal
      uploadVideo({
        video,
        agent,
        did,
        signal,
        _,
        setProgress: p => {
          dispatch({type: 'SetProgress', progress: p})
        },
      }).then(
        response => {
          if (signal.aborted) {
            return
          }
          dispatch({
            type: 'SetProcessing',
            jobId: response.jobId,
          })
        },
        e => {
          if (signal.aborted) {
            return
          }
          if (e instanceof AbortError) {
            return
          } else if (
            e instanceof ServerError ||
            e instanceof UploadLimitError
          ) {
            const message = getErrorMessage(e, _)
            dispatch({
              type: 'SetError',
              error: message,
            })
          } else {
            dispatch({
              type: 'SetError',
              error: _(msg`An error occurred while uploading the video.`),
            })
          }
          logger.error('Error uploading video', {safeMessage: e})
        },
      )
    },
    [agent, did, state.abortController, _],
  )

  const selectVideo = React.useCallback(
    (asset: ImagePickerAsset) => {
      processVideo(
        asset,
        dispatch,
        onVideoCompressed,
        state.abortController.signal,
        _,
      )
    },
    [_, state.abortController, dispatch, onVideoCompressed],
  )

  const clearVideo = () => {
    state.abortController.abort()
    if (state.jobId) {
      queryClient.cancelQueries({
        queryKey: RQKEY(state.jobId),
      })
    }
    dispatch({type: 'Reset'})
  }

  const updateVideoDimensions = useCallback((width: number, height: number) => {
    dispatch({
      type: 'SetDimensions',
      width,
      height,
    })
  }, [])

  // Whenever we receive an initial video uri, we should immediately run compression if necessary
  useEffect(() => {
    if (initialVideoUri) {
      selectVideo({uri: initialVideoUri} as ImagePickerAsset)
    }
  }, [initialVideoUri, selectVideo])

  return {
    state,
    selectVideo,
    clearVideo,
    updateVideoDimensions,
  }
}

const useUploadStatusQuery = ({
  jobId,
  onStatusChange,
  onSuccess,
  onError,
}: {
  jobId: string | undefined
  onStatusChange: (status: AppBskyVideoDefs.JobStatus) => void
  onSuccess: (blobRef: BlobRef) => void
  onError: (error: Error) => void
}) => {
  const [enabled, setEnabled] = React.useState(!!jobId)

  const [prevJobId, setPrevJobId] = React.useState(jobId)
  if (jobId !== prevJobId) {
    setPrevJobId(jobId)
    setEnabled(!!jobId)
  }

  const {error} = useQuery({
    queryKey: RQKEY(jobId),
    queryFn: async () => {
      if (!jobId) return

      const videoAgent = createVideoAgent()
      const {data} = await videoAgent.app.bsky.video.getJobStatus({jobId})
      const status = data.jobStatus
      if (status.state === 'JOB_STATE_COMPLETED') {
        setEnabled(false)
        if (!status.blob)
          throw new Error('Job completed, but did not return a blob')
        onSuccess(status.blob)
      } else if (status.state === 'JOB_STATE_FAILED') {
        throw new Error(status.error ?? 'Job failed to process')
      }
      onStatusChange(status)
      return status
    },
    enabled,
    refetchInterval: 1500,
  })

  useEffect(() => {
    if (error) {
      onError(error)
      setEnabled(false)
    }
  }, [error, onError])
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
  onVideoCompressed: (video: CompressedVideo) => void,
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
  dispatch({type: 'SetProgress', progress: 0})

  compressVideo(asset, {
    onProgress: num => {
      if (signal.aborted) {
        return
      }
      dispatch({type: 'SetProgress', progress: trunc2dp(num)})
    },
    signal,
  }).then(
    (video: CompressedVideo) => {
      if (signal.aborted) {
        return
      }
      dispatch({
        type: 'SetVideo',
        video,
      })
      onVideoCompressed(video)
    },
    (e: any) => {
      if (signal.aborted) {
        return
      }
      if (e instanceof AbortError) {
        return
      } else if (e instanceof VideoTooLargeError) {
        dispatch({
          type: 'SetError',
          error: _(msg`The selected video is larger than 50MB.`),
        })
      } else {
        dispatch({
          type: 'SetError',
          error: _(msg`An error occurred while compressing the video.`),
        })
        logger.error('Error compressing video', {safeMessage: e})
      }
    },
  )
}

function getErrorMessage(e: Error, _: I18n['_']): string {
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
