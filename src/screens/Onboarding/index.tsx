import {useMemo, useReducer} from 'react'
import {View} from 'react-native'
import * as bcp47Match from 'bcp-47-match'

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
import {useFindContactsFlowState} from '#/components/contacts/state'
import {Portal} from '#/components/Portal'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useAnalytics} from '#/analytics'
import {ENV, IS_NATIVE} from '#/env'
import {StepFindContacts} from './StepFindContacts'
import {StepFindContactsIntro} from './StepFindContactsIntro'
import {StepSuggestedAccounts} from './StepSuggestedAccounts'
import {StepSuggestedStarterpacks} from './StepSuggestedStarterpacks'

export function Onboarding() {
  const t = useTheme()
  const ax = useAnalytics()

  const {contentLanguages} = useLanguagePrefs()
  const probablySpeaksEnglish = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])

  // starter packs screen is currently geared towards english-speaking accounts
  const showSuggestedStarterpacks = ENV !== 'e2e' && probablySpeaksEnglish

  const findContactsEnabled =
    useIsFindContactsFeatureEnabledBasedOnGeolocation()
  const showFindContacts =
    ENV !== 'e2e' &&
    IS_NATIVE &&
    findContactsEnabled &&
    !ax.features.enabled(ax.features.ImportContactsOnboardingDisable)

  const [state, dispatch] = useReducer(
    reducer,
    {
      starterPacksStepEnabled: showSuggestedStarterpacks,
      findContactsStepEnabled: showFindContacts,
    },
    createInitialOnboardingState,
  )
  const [contactsFlowState, contactsFlowDispatch] = useFindContactsFlowState()

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
                {/* FindContactsFlow cannot be nested in Layout */}
                {state.activeStep === 'find-contacts' ? (
                  <StepFindContacts
                    flowState={contactsFlowState}
                    flowDispatch={contactsFlowDispatch}
                  />
                ) : (
                  <Layout>
                    {state.activeStep === 'profile' && <StepProfile />}
                    {state.activeStep === 'interests' && <StepInterests />}
                    {state.activeStep === 'suggested-accounts' && (
                      <StepSuggestedAccounts />
                    )}
                    {state.activeStep === 'suggested-starterpacks' && (
                      <StepSuggestedStarterpacks />
                    )}
                    {state.activeStep === 'find-contacts-intro' && (
                      <StepFindContactsIntro />
                    )}
                    {state.activeStep === 'finished' && <StepFinished />}
                  </Layout>
                )}
              </ScreenTransition>
            </Context.Provider>
          </OnboardingHeaderSlot.Provider>
        </OnboardingControls.Provider>
      </View>
    </Portal>
  )
}
