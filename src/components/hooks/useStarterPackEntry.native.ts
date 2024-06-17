import React from 'react'

import {createStarterPackLinkFromAndroidReferrer} from 'lib/strings/starter-pack'
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
          uri = createStarterPackLinkFromAndroidReferrer(res.installReferrer)
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
