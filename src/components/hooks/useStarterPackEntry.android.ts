import React from 'react'

import {useSetUsedStarterPack} from 'state/preferences/starter-pack'
import GooglePlayReferrer from '../../../modules/expo-google-play-referrer'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const setUsedStarterPack = useSetUsedStarterPack()

  React.useEffect(() => {
    ;(async () => {
      const res = await GooglePlayReferrer.getReferrerInfoAsync()

      if (
        res &&
        res.installReferrer &&
        res.installReferrer.startsWith('https://bsky.app/start/')
      ) {
        const [_, _start, name, rkey] = new URL(
          res.installReferrer,
        ).pathname.split('/')

        if (name && rkey) {
          setUsedStarterPack({
            uri: res.installReferrer,
          })
        }
      }

      setReady(true)
    })()
  }, [setUsedStarterPack])

  return ready
}
