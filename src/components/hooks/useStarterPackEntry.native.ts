import React from 'react'

import {makeStarterPackLink} from 'lib/routes/links'
import {isAndroid} from 'platform/detection'
import {useSetCurrentStarterPack} from 'state/preferences/starter-pack'
import {useUsedStarterPacks} from 'state/preferences/used-starter-packs'
import SwissArmyKnife from '../../../modules/expo-bluesky-swiss-army'
import GooglePlayReferrer from '../../../modules/expo-google-play-referrer'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const setCurrentStarterPack = useSetCurrentStarterPack()
  const usedStarterPacks = useUsedStarterPacks()
  const hasRan = React.useRef(false)

  React.useEffect(() => {
    if (ready || hasRan.current) return

    hasRan.current = true
    ;(async () => {
      let uri: string | null | undefined

      if (isAndroid) {
        const res = await GooglePlayReferrer.getReferrerInfoAsync()

        if (res && res.installReferrer) {
          const parts = res.installReferrer.split('&')
          const starterPackSource = parts
            .find(part => part.startsWith('utm_content='))
            ?.split('=')[1]
          const sourceParts = starterPackSource?.split('-')
          if (sourceParts?.length === 3 && sourceParts[0] === 'starterpack') {
            uri = makeStarterPackLink(sourceParts[1], sourceParts[2])
          }
        }
      } else {
        uri = await SwissArmyKnife.getStringValueAsync('starterPackUri', true)
      }

      if (uri && !usedStarterPacks?.includes(uri)) {
        setCurrentStarterPack({
          uri,
        })
      }

      setReady(true)
    })()
  }, [ready, setCurrentStarterPack, usedStarterPacks])

  return ready
}
