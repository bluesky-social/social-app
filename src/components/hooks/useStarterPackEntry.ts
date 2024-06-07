import React from 'react'

import {useSetStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setStarterPack = useSetStarterPack()

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const pathParts = url.pathname.split('/')
    if (pathParts[0] === 'start' && pathParts.length === 2) {
      setStarterPack(pathParts[1])
    }
  }, [setStarterPack])
}
