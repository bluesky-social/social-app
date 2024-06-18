import React from 'react'

import {createStarterPackLinkFromAndroidReferrer} from 'lib/strings/starter-pack'
import {isAndroid} from 'platform/detection'
import {useSetCurrentStarterPack} from 'state/preferences/starter-pack'
import {
  useHasCheckedForStarterPack,
  useSetHasCheckedForStarterPack,
} from 'state/preferences/used-starter-packs'
import SwissArmyKnife from '../../../modules/expo-bluesky-swiss-army'
import GooglePlayReferrer from '../../../modules/expo-google-play-referrer'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const setCurrentStarterPack = useSetCurrentStarterPack()
  const hasCheckedForStarterPack = useHasCheckedForStarterPack()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  React.useEffect(() => {
    if (ready) return
    if (hasCheckedForStarterPack) {
      setReady(true)
      return
    }

    setHasCheckedForStarterPack(true)
    ;(async () => {
      let uri: string | null | undefined

      if (isAndroid) {
        const res = await GooglePlayReferrer.getReferrerInfoAsync()

        if (res && res.installReferrer) {
          uri = createStarterPackLinkFromAndroidReferrer(res.installReferrer)
        }
      } else {
        uri = await SwissArmyKnife.getStringValueAsync('starterPackUri', true)
        SwissArmyKnife.setStringValueAsync('starterPackUri', null, true)
      }

      if (uri) {
        setCurrentStarterPack({
          uri,
        })
      }

      setReady(true)
    })()
  }, [
    ready,
    setCurrentStarterPack,
    setHasCheckedForStarterPack,
    hasCheckedForStarterPack,
  ])

  return ready
}
