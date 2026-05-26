import {useEffect, useState} from 'react'

import {httpStarterPackUriToAtUri} from '#/lib/strings/starter-pack'
import {useSetActiveStarterPack} from '#/state/shell/landing'

export function useLandingEntry() {
  const [ready, setReady] = useState(false)
  const setActiveStarterPack = useSetActiveStarterPack()

  useEffect(() => {
    const href = window.location.href
    const url = new URL(href)

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
  }, [setActiveStarterPack])

  return ready
}
