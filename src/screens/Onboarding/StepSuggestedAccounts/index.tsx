import {useMemo} from 'react'
import * as bcp47Match from 'bcp-47-match'

import {popularInterests, useInterestsDisplayNames} from '#/lib/interests'
import {useLanguagePrefs} from '#/state/preferences'
import {useOnboardingInternalState} from '#/screens/Onboarding/state'
import {boostInterests} from '#/components/InterestTabs'
import {useAnalytics} from '#/analytics'
import {OnboardingAccounts} from './OnboardingAccounts'
import {SuggestedAccounts} from './SuggestedAccounts'

export function StepSuggestedAccounts() {
  const ax = useAnalytics()
  const {state} = useOnboardingInternalState()

  /*
   * Special language handling copied wholesale from the Explore screen
   */
  const {contentLanguages} = useLanguagePrefs()
  const useFullExperience = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])
  const interestsDisplayNames = useInterestsDisplayNames()
  const selectedInterests = state.interestsStepResults.selectedInterests
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(selectedInterests))

  const shouldUseOnboardingUsers = !ax.features.enabled(
    ax.features.SuggestedOnboardingUsersDisable,
  )

  // React Hooks can't be conditional, so we hoist the feature flag check here
  return shouldUseOnboardingUsers ? (
    <OnboardingAccounts
      interests={interests}
      selectedInterests={selectedInterests}
      useFullExperience={useFullExperience}
    />
  ) : (
    <SuggestedAccounts
      interests={interests}
      selectedInterests={selectedInterests}
      useFullExperience={useFullExperience}
    />
  )
}
