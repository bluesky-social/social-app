import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_SERVICE_DID} from '#/lib/constants'
import {UploadLimitError} from '#/lib/media/video/errors'
import {getServiceAuthAudFromUrl} from '#/lib/strings/url-helpers'
import {useAgent} from '#/state/session'
import {useVideoAgent} from './util'

export function useServiceAuthToken({
  aud,
  lxm,
  exp,
}: {
  aud?: string
  lxm: string
  exp?: number
}) {
  const agent = useAgent()

  return useCallback(async () => {
    const pdsAud = getServiceAuthAudFromUrl(agent.dispatchUrl)

    if (!pdsAud) {
      throw new Error('Agent does not have a PDS URL')
    }

    const {data: serviceAuth} = await agent.com.atproto.server.getServiceAuth({
      aud: aud ?? pdsAud,
      lxm,
      exp,
    })

    return serviceAuth.token
  }, [agent, aud, lxm, exp])
}

export function useVideoUploadLimits() {
  const agent = useVideoAgent()
  const getToken = useServiceAuthToken({
    lxm: 'app.bsky.video.getUploadLimits',
    aud: VIDEO_SERVICE_DID,
  })
  const {_} = useLingui()

  return useCallback(async () => {
    const {data: limits} = await agent.app.bsky.video.getUploadLimits(
      {},
      {headers: {Authorization: `Bearer ${await getToken()}`}},
    )

    if (!limits.canUpload) {
      if (limits.message) {
        throw new UploadLimitError(limits.message)
      } else {
        throw new UploadLimitError(
          _(
            msg`You have temporarily reached the limit for video uploads. Please try again later.`,
          ),
        )
      }
    }
  }, [agent, _, getToken])
}
