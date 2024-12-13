import React from 'react'

import {httpStarterPackUriToAtUri} from '#/lib/strings/starter-pack'
import {useSetActiveStarterPack} from '#/state/shell/starter-pack'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)

  const setActiveStarterPack = useSetActiveStarterPack()

  React.useEffect(() => {
    const href = window.location.href
    const atUri = httpStarterPackUriToAtUri(href)

    if (atUri) {
      const url = new URL(href)
      // Determines if an App Clip is loading this landing page
      const isClip = url.searchParams.get('clip') === 'true'
      setActiveStarterPack({
        uri: atUri,
        isClip,
      })
    }

    setReady(true)
  }, [setActiveStarterPack])

  return ready
}
