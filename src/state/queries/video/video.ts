import React from 'react'
import {ImagePickerAsset} from 'expo-image-picker'
import {BlobRef} from '@atproto/api'
import {AppBskyVideoDefs} from '@atproto/api-prerelease'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {logger} from '#/logger'
import {CompressedVideo} from 'lib/media/video/compress'
import {VideoTooLargeError} from 'lib/media/video/errors'
import {useCompressVideoMutation} from 'state/queries/video/compress-video'
import {useVideoAgent} from 'state/queries/video/util'
import {useUploadVideoMutation} from 'state/queries/video/video-upload'

type Status = 'idle' | 'compressing' | 'processing' | 'uploading' | 'done'

type Action =
  | {type: 'SetStatus'; status: Status}
  | {type: 'SetProgress'; progress: number}
  | {type: 'SetError'; error: string | undefined}
  | {type: 'Reset'}
  | {type: 'SetAsset'; asset: ImagePickerAsset}
  | {type: 'SetVideo'; video: CompressedVideo}
  | {type: 'SetJobStatus'; jobStatus: AppBskyVideoDefs.JobStatus}
  | {type: 'SetBlobRef'; blobRef: BlobRef}

export interface State {
  status: Status
  progress: number
  asset?: ImagePickerAsset
  video: CompressedVideo | null
  jobStatus?: AppBskyVideoDefs.JobStatus
  blobRef?: BlobRef
  error?: string
}

function reducer(state: State, action: Action): State {
  let updatedState = state
  if (action.type === 'SetStatus') {
    updatedState = {...state, status: action.status}
  } else if (action.type === 'SetProgress') {
    updatedState = {...state, progress: action.progress}
  } else if (action.type === 'SetError') {
    updatedState = {...state, error: action.error}
  } else if (action.type === 'Reset') {
    updatedState = {
      status: 'idle',
      progress: 0,
      video: null,
      blobRef: undefined,
    }
  } else if (action.type === 'SetAsset') {
    updatedState = {...state, asset: action.asset}
  } else if (action.type === 'SetVideo') {
    updatedState = {...state, video: action.video}
  } else if (action.type === 'SetJobStatus') {
    updatedState = {...state, jobStatus: action.jobStatus}
  } else if (action.type === 'SetBlobRef') {
    updatedState = {...state, blobRef: action.blobRef}
  }
  return updatedState
}

export function useUploadVideo({
  setStatus,
  onSuccess,
}: {
  setStatus: (status: string) => void
  onSuccess: () => void
}) {
  const {_} = useLingui()
  const [state, dispatch] = React.useReducer(reducer, {
    status: 'idle',
    progress: 0,
    video: null,
  })

  const {setJobId} = useUploadStatusQuery({
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
        type: 'SetBlobRef',
        blobRef,
      })
      dispatch({
        type: 'SetStatus',
        status: 'idle',
      })
      onSuccess()
    },
  })

  const {mutate: onVideoCompressed} = useUploadVideoMutation({
    onSuccess: response => {
      dispatch({
        type: 'SetStatus',
        status: 'processing',
      })
      setJobId(response.jobId)
    },
    onError: e => {
      dispatch({
        type: 'SetError',
        error: _(msg`An error occurred while uploading the video.`),
      })
      logger.error('Error uploading video', {safeMessage: e})
    },
    setProgress: p => {
      dispatch({type: 'SetProgress', progress: p})
    },
  })

  const {mutate: onSelectVideo} = useCompressVideoMutation({
    onProgress: p => {
      dispatch({type: 'SetProgress', progress: p})
    },
    onError: e => {
      if (e instanceof VideoTooLargeError) {
        dispatch({
          type: 'SetError',
          error: _(msg`The selected video is larger than 100MB.`),
        })
      } else {
        dispatch({
          type: 'SetError',
          // @TODO better error message from server, left untranslated on purpose
          error: 'An error occurred while compressing the video.',
        })
        logger.error('Error compressing video', {safeMessage: e})
      }
    },
    onSuccess: (video: CompressedVideo) => {
      dispatch({
        type: 'SetVideo',
        video,
      })
      dispatch({
        type: 'SetStatus',
        status: 'uploading',
      })
      onVideoCompressed(video)
    },
  })

  const selectVideo = (asset: ImagePickerAsset) => {
    dispatch({
      type: 'SetAsset',
      asset,
    })
    dispatch({
      type: 'SetStatus',
      status: 'compressing',
    })
    onSelectVideo(asset)
  }

  const clearVideo = () => {
    // @TODO cancel any running jobs
    dispatch({type: 'Reset'})
  }

  return {
    state,
    dispatch,
    selectVideo,
    clearVideo,
  }
}

const useUploadStatusQuery = ({
  onStatusChange,
  onSuccess,
}: {
  onStatusChange: (status: AppBskyVideoDefs.JobStatus) => void
  onSuccess: (blobRef: BlobRef) => void
}) => {
  const videoAgent = useVideoAgent()
  const [enabled, setEnabled] = React.useState(true)
  const [jobId, setJobId] = React.useState<string>()

  const {isLoading, isError} = useQuery({
    queryKey: ['video-upload', jobId],
    queryFn: async () => {
      if (!jobId) return // this won't happen, can ignore

      const {data} = await videoAgent.app.bsky.video.getJobStatus({jobId})
      const status = data.jobStatus
      if (status.state === 'JOB_STATE_COMPLETED') {
        setEnabled(false)
        if (!status.blob)
          throw new Error('Job completed, but did not return a blob')
        onSuccess(status.blob)
      } else if (status.state === 'JOB_STATE_FAILED') {
        throw new Error('Job failed to process')
      }
      onStatusChange(status)
      return status
    },
    enabled: Boolean(jobId && enabled),
    refetchInterval: 1500,
  })

  return {
    isLoading,
    isError,
    setJobId: (_jobId: string) => {
      setJobId(_jobId)
    },
  }
}
