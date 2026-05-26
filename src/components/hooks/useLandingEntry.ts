import {useEffect, useState} from 'react'

import {httpStarterPackUriToAtUri} from '#/lib/strings/starter-pack'
import {
  useSetActiveGroupChatJoinRequest,
  useSetActiveStarterPack,
} from '#/state/shell/landing'

export function useLandingEntry() {
  const [ready, setReady] = useState(false)
  const setActiveStarterPack = useSetActiveStarterPack()
  const setActiveGroupChatJoinRequest = useSetActiveGroupChatJoinRequest()

  useEffect(() => {
    const href = window.location.href
    const url = new URL(href)

    // Check for group chat join request (/c/:code pattern)
    const groupChatMatch = url.pathname.match(/^\/c\/([a-z0-9]{7,10})$/i)
    if (groupChatMatch && groupChatMatch[1]) {
      const code = groupChatMatch[1]
      setActiveGroupChatJoinRequest({
        uri: href,
        code,
      })
      setReady(true)
      return
    }

    // Check for starter pack
    const atUri = httpStarterPackUriToAtUri(href)
    if (atUri) {
      // Determines if an App Clip is loading this landing page
      const isClip = url.searchParams.get('clip') === 'true'
      setActiveStarterPack({
        uri: atUri,
        isClip,
      })
      setReady(true)
      return
    }

    setReady(true)
  }, [setActiveStarterPack, setActiveGroupChatJoinRequest])

  return ready
}
