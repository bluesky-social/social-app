import React from 'react'

import {
  createStarterPackLinkFromAndroidReferrer,
  httpStarterPackUriToAtUri,
} from 'lib/strings/starter-pack'
import {isAndroid} from 'platform/detection'
import {useHasCheckedForStarterPack} from 'state/preferences/used-starter-packs'
import {useSetActiveStarterPack} from 'state/shell/starter-pack'
import {DevicePrefs, Referrer} from '../../../modules/expo-bluesky-swiss-army'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const setActiveStarterPack = useSetActiveStarterPack()
  const hasCheckedForStarterPack = useHasCheckedForStarterPack()

  React.useEffect(() => {
    if (ready) return

    // On Android, we cannot clear the referral link. It gets stored for 90 days and all we can do is query for it. So,
    // let's just ensure we never check again after the first time.
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
        const res = await Referrer.getGooglePlayReferrerInfoAsync()

        if (res && res.installReferrer) {
          uri = createStarterPackLinkFromAndroidReferrer(res.installReferrer)
        }
      } else {
        const res = await DevicePrefs.getStringValueAsync(
          'starterPackUri',
          true,
        )

        if (res) {
          uri = httpStarterPackUriToAtUri(res)
          DevicePrefs.setStringValueAsync('starterPackUri', null, true)
        }
      }

      if (uri) {
        setActiveStarterPack({
          uri,
        })
      }

      setReady(true)
    })()

    return () => {
      clearTimeout(timeout)
    }
  }, [ready, setActiveStarterPack, hasCheckedForStarterPack])

  return ready
}
