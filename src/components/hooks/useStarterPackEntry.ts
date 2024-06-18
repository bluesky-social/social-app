import React from 'react'

import {parseStarterPackUri} from 'lib/strings/starter-pack'
import {useSetCurrentStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setCurrentStarterPack = useSetCurrentStarterPack()

  React.useEffect(() => {
    const href = window.location.href
    const parsed = parseStarterPackUri(href)

    if (parsed) {
      const url = new URL(href)
      const isClip = url.searchParams.get('clip') === 'true'

      setCurrentStarterPack({
        uri: href,
        isClip,
      })
    }
  }, [setCurrentStarterPack])

  return true
}
