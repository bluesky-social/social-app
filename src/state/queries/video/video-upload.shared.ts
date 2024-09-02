import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {UploadLimitError} from '#/lib/media/video/errors'
import {getServiceAuthAudFromUrl} from '#/lib/strings/url-helpers'
import {useAgent} from '#/state/session'
import {useVideoAgent} from './util'

export function useServiceAuthToken() {
  const agent = useAgent()

  return useCallback(async () => {
    const serviceAuthAud = getServiceAuthAudFromUrl(agent.dispatchUrl)

    if (!serviceAuthAud) {
      throw new Error('Agent does not have a PDS URL')
    }

    const {data: serviceAuth} = await agent.com.atproto.server.getServiceAuth({
      aud: serviceAuthAud,
      lxm: 'com.atproto.repo.uploadBlob',
      exp: Date.now() / 1000 + 60 * 30, // 30 minutes
    })

    return serviceAuth.token
  }, [agent])
}

export function useVideoUploadLimits() {
  const agent = useVideoAgent()
  const {_} = useLingui()

  return useCallback(
    async (token: string) => {
      const {data: limits} = await agent.app.bsky.video.getUploadLimits(
        {},
        {headers: {Authorization: `Bearer ${token}`}},
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
    },
    [agent, _],
  )
}
