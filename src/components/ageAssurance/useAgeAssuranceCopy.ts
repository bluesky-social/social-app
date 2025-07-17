import {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function useAgeAssuranceCopy() {
  const {_} = useLingui()

  return useMemo(() => {
    return {
      notice: _(
        msg`The laws in your location require you to verify you're an adult before accessing certain features on Bluesky, like adult content and direct messaging.`,
      ),
      banner: _(
        msg`The laws in your location require you to verify you're an adult. Tap to learn more.`,
      ),
      chatsInfoText: _(
        msg`Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult.`,
      ),
    }
  }, [_])
}
