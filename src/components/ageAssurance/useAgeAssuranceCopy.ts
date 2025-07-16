import {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function useAgeAssuranceCopy() {
  const {_} = useLingui()

  return useMemo(() => {
    return {
      notice: _(
        msg`The laws in your location require that you verify your age before accessing certain features on Bluesky like adult content and direct messaging.`,
      ),
      chatsInfoText: _(
        msg`Don't worry! All existing messages and settings are saved and will be available after you've been verified to be 18 or older.`,
      ),
    }
  }, [_])
}
