import {useMemo} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useAgeAssurance} from '#/ageAssurance'

export function useAgeAssuranceCopy() {
  const {t: l} = useLingui()
  const aa = useAgeAssurance()

  const hasCompletedFlow = aa.state.status === aa.Status.Assured

  return useMemo(() => {
    return {
      notice: hasCompletedFlow
        ? l`You have completed the Age Assurance process, but based on the results, we cannot be sure that you are 18 years of age or older. Due to laws in your region, certain features on Bluesky must remain restricted until you're able to verify you're an adult.`
        : l`Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult.`,
      banner: l`The laws in your region require you to verify you're an adult to access certain features. Tap to learn more.`,
      chatsInfoText: l`Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult.`,
    }
  }, [l, hasCompletedFlow])
}
