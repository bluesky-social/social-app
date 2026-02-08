import {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function useAgeAssuranceCopy() {
  const {_} = useLingui()

  return useMemo(() => {
    return {
      notice: _(
        msg`Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult.`,
      ),
      banner: _(
        msg`The laws in your location require you to verify you're an adult to access certain features. Tap to learn more.`,
      ),
      chatsInfoText: _(
        msg`Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult.`,
      ),
    }
  }, [_])
}
