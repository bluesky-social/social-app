import {type Client} from '@atproto/lex-client'
import {type NsidString} from '@atproto/syntax'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {VIDEO_SERVICE_DID} from '#/lib/constants'
import {UploadLimitError} from '#/lib/media/video/errors'
import {getServiceAuthAudFromUrl} from '#/lib/strings/url-helpers'
import {app, com} from '#/lexicons'
import {createVideoServiceClient} from './util'

export async function getServiceAuthToken({
  client,
  dispatchUrl,
  aud,
  lxm,
  exp,
}: {
  client: Client
  /**
   * The account's dispatch URL (old `agent.dispatchUrl`: the PDS entryway,
   * falling back to the service URL). Only required when `aud` is omitted, so
   * the default audience can be derived from the PDS host. The lex `Client`
   * does not expose this - it routes to the PDS per-request internally - so the
   * caller (which holds the session) must pass it.
   */
  dispatchUrl?: string | URL
  aud?: string
  lxm: NsidString
  exp?: number
}) {
  let resolvedAud = aud
  if (!resolvedAud) {
    if (!dispatchUrl) {
      throw new Error('Missing service auth audience: no aud or dispatchUrl')
    }
    const pdsAud = getServiceAuthAudFromUrl(dispatchUrl)
    if (!pdsAud) {
      throw new Error('Agent does not have a PDS URL')
    }
    resolvedAud = pdsAud
  }
  const {token} = await client.call(com.atproto.server.getServiceAuth, {
    aud: resolvedAud,
    lxm,
    exp,
  })
  return token
}

export async function getVideoUploadLimits(client: Client, i18n: I18n) {
  const token = await getServiceAuthToken({
    client,
    lxm: 'app.bsky.video.getUploadLimits',
    aud: VIDEO_SERVICE_DID,
  })
  const videoClient = createVideoServiceClient(token)
  const limits = await videoClient
    .call(app.bsky.video.getUploadLimits)
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
        i18n._(
          msg`You have temporarily reached the limit for video uploads. Please try again later.`,
        ),
      )
    }
  }
}
