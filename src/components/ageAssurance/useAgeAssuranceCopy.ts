import {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssurance} from '#/ageAssurance'

export function useAgeAssuranceCopy() {
  const {_} = useLingui()
  const aa = useAgeAssurance()

  return useMemo(() => {
    return {
      notice:
        aa.state.access === aa.Access.Safe
          ? _(
              msg`Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult.`,
            )
          : _(
              msg`The laws in your location require you to verify you're an adult before accessing certain features on Bluesky, like adult content and direct messaging.`,
            ),
      banner: _(
        msg`The laws in your location require you to verify you're an adult to access certain features. Tap to learn more.`,
      ),
      chatsInfoText: _(
        msg`Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult.`,
      ),
    }
  }, [_, aa])
}
