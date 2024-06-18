import React from 'react'

import {httpStarterPackUriToAtUri} from 'lib/strings/starter-pack'
import {useSetCurrentStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setCurrentStarterPack = useSetCurrentStarterPack()

  React.useEffect(() => {
    const href = window.location.href
    const atUri = httpStarterPackUriToAtUri(href)

    if (atUri) {
      const url = new URL(href)
      const isClip = url.searchParams.get('clip') === 'true'
      setCurrentStarterPack({
        uri: atUri,
        isClip,
      })
    }
  }, [setCurrentStarterPack])

  return true
}
