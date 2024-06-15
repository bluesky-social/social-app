import React from 'react'

import {useSetUsedStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setUsedStarterPack = useSetUsedStarterPack()

  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (url.pathname.startsWith('/start/')) {
      const [_, _start, name, rkey] = url.pathname.split('/')
      const isClip = url.searchParams.get('clip') === 'true'

      if (name && rkey) {
        setUsedStarterPack({
          uri: window.location.href,
          isClip,
        })
      }
    }
  }, [setUsedStarterPack])

  return true
}
