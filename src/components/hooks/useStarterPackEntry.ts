import React from 'react'

import {useSetUsedStarterPack} from 'state/preferences/starter-pack'

export function useStarterPackEntry() {
  const setUsedStarterPack = useSetUsedStarterPack()

  React.useEffect(() => {
    const url = new URL(window.location.href)

    if (url.pathname.startsWith('/start/')) {
      console.log('yes sp')
      const [_, _start, name, rkey] = url.pathname.split('/')

      console.log()

      if (name && rkey) {
        setUsedStarterPack({
          uri: window.href,
        })
      }
    } else {
      console.log('no sp')
    }
  }, [setUsedStarterPack])

  return true
}
