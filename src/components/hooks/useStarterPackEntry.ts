import React from 'react'

import {useSetCurrentStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setCurrentStarterPack = useSetCurrentStarterPack()

  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (url.pathname.startsWith('/start/')) {
      const [_, _start, name, rkey] = url.pathname.split('/')
      const isClip = url.searchParams.get('clip') === 'true'

      if (name && rkey) {
        setCurrentStarterPack({
          uri: window.location.href,
          isClip,
        })
      }
    }
  }, [setCurrentStarterPack])

  return true
}
