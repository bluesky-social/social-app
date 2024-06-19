import React from 'react'

import {createStarterPackLinkFromAndroidReferrer} from 'lib/strings/starter-pack'
import {isAndroid} from 'platform/detection'
import {
  useHasCheckedForStarterPack,
  useSetHasCheckedForStarterPack,
} from 'state/preferences/used-starter-packs'
import {useSetActiveStarterPack} from 'state/shell/starter-pack'
import SwissArmyKnife from '../../../modules/expo-bluesky-swiss-army'
import GooglePlayReferrer from '../../../modules/expo-google-play-referrer'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const setCurrentStarterPack = useSetActiveStarterPack()
  const hasCheckedForStarterPack = useHasCheckedForStarterPack()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  React.useEffect(() => {
    if (ready) return
    if (hasCheckedForStarterPack) {
      setReady(true)
      return
    }

    // Safety for Android. Very unlike this could happen, but just in case. The response should be nearly immediate
    const timeout = setTimeout(() => {
      setReady(true)
    }, 500)

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

    return () => {
      clearTimeout(timeout)
    }
  }, [
    ready,
    setCurrentStarterPack,
    setHasCheckedForStarterPack,
    hasCheckedForStarterPack,
  ])

  return ready
}
