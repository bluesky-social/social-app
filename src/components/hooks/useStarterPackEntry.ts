import React from 'react'

import {useSetUsedStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setUsedStarterPack = useSetUsedStarterPack()

  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (url.pathname.startsWith('/start/')) {
      const [_, _start, name, rkey] = url.pathname.split('/')

      if (name && rkey) {
        setUsedStarterPack({
          uri: window.location.href,
        })
      }
    }
  }, [setUsedStarterPack])

  return true
}
