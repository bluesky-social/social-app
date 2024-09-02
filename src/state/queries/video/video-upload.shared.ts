import {useCallback} from 'react'

import {getServiceAuthAudFromUrl} from '#/lib/strings/url-helpers'
import {useAgent} from '#/state/session'

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
