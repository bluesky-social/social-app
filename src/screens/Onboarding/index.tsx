import {useMemo, useReducer} from 'react'
import {View} from 'react-native'
import * as bcp47Match from 'bcp-47-match'

import {useBrand} from '#/lib/community/BrandContext'
import {useLanguagePrefs} from '#/state/preferences'
import {
  Layout,
  OnboardingControls,
  OnboardingHeaderSlot,
} from '#/screens/Onboarding/Layout'
import {
  Context,
  createInitialOnboardingState,
  reducer,
} from '#/screens/Onboarding/state'
import {StepFinished} from '#/screens/Onboarding/StepFinished'
import {StepInterests} from '#/screens/Onboarding/StepInterests'
import {StepProfile} from '#/screens/Onboarding/StepProfile'
import {atoms as a, useTheme} from '#/alf'
import {useIsFindContactsFeatureEnabledBasedOnGeolocation} from '#/components/contacts/country-allowlist'
import {Portal} from '#/components/Portal'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useAnalytics} from '#/analytics'
import {ENV, IS_NATIVE} from '#/env'

export function Onboarding() {
  const t = useTheme()
  const ax = useAnalytics()

  const brand = useBrand()
  const {contentLanguages} = useLanguagePrefs()
  const probablySpeaksEnglish = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])

  // Bluesky's AI-suggested starter packs are English-only, but when a
  // community DID is configured the community curates its own packs and
  // should decide for itself whether they're relevant across locales.
  const showSuggestedStarterpacks =
    ENV !== 'e2e' && (!!brand.metadata.communityDid || probablySpeaksEnglish)

  const findContactsEnabled =
    useIsFindContactsFeatureEnabledBasedOnGeolocation()
  const showFindContacts =
    ENV !== 'e2e' &&
    IS_NATIVE &&
    findContactsEnabled &&
    !ax.features.enabled(ax.features.ImportContactsOnboardingDisable)

  // When a community DID is configured, starter packs from that community
  // handle account discovery — skip the generic suggested-accounts step
  // which would otherwise 502 against the community appview.
  const showSuggestedAccounts = ENV !== 'e2e' && !brand.metadata.communityDid

  const [state, dispatch] = useReducer(
    reducer,
    {
      suggestedAccountsStepEnabled: showSuggestedAccounts,
      starterPacksStepEnabled: showSuggestedStarterpacks,
      findContactsStepEnabled: showFindContacts,
    },
    createInitialOnboardingState,
  )

  return (
    <Portal>
      <View style={[a.absolute, a.inset_0, t.atoms.bg]}>
        <OnboardingControls.Provider>
          <OnboardingHeaderSlot.Provider>
            <Context.Provider
              value={useMemo(() => ({state, dispatch}), [state, dispatch])}>
              <ScreenTransition
                key={state.activeStep}
                direction={state.stepTransitionDirection}
                style={a.flex_1}>
                <Layout>
                  {state.activeStep === 'profile' && <StepProfile />}
                  {state.activeStep === 'interests' && <StepInterests />}
                  {state.activeStep === 'finished' && <StepFinished />}
                </Layout>
              </ScreenTransition>
            </Context.Provider>
          </OnboardingHeaderSlot.Provider>
        </OnboardingControls.Provider>
      </View>
    </Portal>
  )
}
