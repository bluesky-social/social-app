import React from 'react'

import {makeStarterPackLink} from 'lib/routes/links'
import {
  useSetUsedStarterPack,
  useUsedStarterPack,
} from 'state/preferences/starter-pack'
import GooglePlayReferrer from '../../../modules/expo-google-play-referrer'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)
  const usedStarterPack = useUsedStarterPack()
  const setUsedStarterPack = useSetUsedStarterPack()

  React.useEffect(() => {
    if (ready) return
    ;(async () => {
      const res = await GooglePlayReferrer.getReferrerInfoAsync()

      if (res && res.installReferrer) {
        // The `utm_content` parameter should be `starterpack-<name>-rkey>`. Let's try to get it from the parameters
        // and create a URI for it if it's valid.
        const parts = res.installReferrer.split('&')
        const starterPackSource = parts
          .find(part => part.startsWith('utm_content='))
          ?.split('=')[1]
        const sourceParts = starterPackSource?.split('-')

        if (sourceParts?.length === 3 && sourceParts[0] === 'starterpack') {
          // Android doesn't clear the referrer info for a total of 90 days. We want to make sure that we don't
          // retrigger this on accident.
          // We won't actually set `lastUsedUri` until a _successful_ use of the starter pack, meaning a new account
          // has actually completed onboarding with the given starter pack.
          const uri = makeStarterPackLink(sourceParts[1], sourceParts[2])
          if (uri !== usedStarterPack?.lastUsedUri) {
            setUsedStarterPack({
              uri: makeStarterPackLink(sourceParts[1], sourceParts[2]),
            })
          }
        }
      }
      setReady(true)
    })()
  }, [ready, setUsedStarterPack, usedStarterPack?.lastUsedUri])

  return ready
}
