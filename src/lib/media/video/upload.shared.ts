import {BskyAgent} from '@atproto/api'
import {I18n} from '@lingui/core'
import {msg} from '@lingui/macro'

import {VIDEO_SERVICE_DID} from '#/lib/constants'
import {UploadLimitError} from '#/lib/media/video/errors'
import {getServiceAuthAudFromUrl} from '#/lib/strings/url-helpers'
import {createVideoAgent} from './util'

export async function getServiceAuthToken({
  agent,
  aud,
  lxm,
  exp,
}: {
  agent: BskyAgent
  aud?: string
  lxm: string
  exp?: number
}) {
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
}

export async function getVideoUploadLimits(agent: BskyAgent, _: I18n['_']) {
  const token = await getServiceAuthToken({
    agent,
    lxm: 'app.bsky.video.getUploadLimits',
    aud: VIDEO_SERVICE_DID,
  })
  const videoAgent = createVideoAgent()
  const {data: limits} = await videoAgent.app.bsky.video
    .getUploadLimits({}, {headers: {Authorization: `Bearer ${token}`}})
    .catch(err => {
      if (err instanceof Error) {
        throw new UploadLimitError(err.message)
      } else {
        throw err
      }
    })

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
}
