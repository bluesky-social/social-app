import {useMemo, useReducer} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as bcp47Match from 'bcp-47-match'

import {useGate} from '#/lib/statsig/statsig'
import {useLanguagePrefs} from '#/state/preferences'
import {
  Layout,
  OnboardingControls,
  OnboardingHeaderSlot,
} from '#/screens/Onboarding/Layout'
import {Context, initialState, reducer} from '#/screens/Onboarding/state'
import {StepFinished} from '#/screens/Onboarding/StepFinished'
import {StepInterests} from '#/screens/Onboarding/StepInterests'
import {StepProfile} from '#/screens/Onboarding/StepProfile'
import {Portal} from '#/components/Portal'
import {ScreenTransition} from '#/components/ScreenTransition'
import {ENV} from '#/env'
import {StepSuggestedAccounts} from './StepSuggestedAccounts'
import {StepSuggestedStarterpacks} from './StepSuggestedStarterpacks'

export function Onboarding() {
  const {_} = useLingui()
  const gate = useGate()

  const {contentLanguages} = useLanguagePrefs()
  const probablySpeaksEnglish = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])

  // starter packs screen is currently geared towards english-speaking accounts
  const showSuggestedStarterpacks =
    ENV !== 'e2e' &&
    probablySpeaksEnglish &&
    gate('onboarding_suggested_starterpacks')

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    totalSteps: 4 + (showSuggestedStarterpacks ? 1 : 0),
    experiments: {
      onboarding_suggested_accounts: true,
      onboarding_value_prop: true,
      onboarding_suggested_starterpacks: showSuggestedStarterpacks,
    },
  })

  const interestsDisplayNames = useMemo(() => {
    return {
      news: _(msg`News`),
      journalism: _(msg`Journalism`),
      nature: _(msg`Nature`),
      art: _(msg`Art`),
      comics: _(msg`Comics`),
      writers: _(msg`Writers`),
      culture: _(msg`Culture`),
      sports: _(msg`Sports`),
      pets: _(msg`Pets`),
      animals: _(msg`Animals`),
      books: _(msg`Books`),
      education: _(msg`Education`),
      climate: _(msg`Climate`),
      science: _(msg`Science`),
      politics: _(msg`Politics`),
      fitness: _(msg`Fitness`),
      tech: _(msg`Tech`),
      dev: _(msg`Software Dev`),
      comedy: _(msg`Comedy`),
      gaming: _(msg`Video Games`),
      food: _(msg`Food`),
      cooking: _(msg`Cooking`),
    }
  }, [_])

  return (
    <Portal>
      <OnboardingControls.Provider>
        <OnboardingHeaderSlot.Provider>
          <Context.Provider
            value={useMemo(
              () => ({state, dispatch, interestsDisplayNames}),
              [state, dispatch, interestsDisplayNames],
            )}>
            <Layout>
              <ScreenTransition
                key={state.activeStep}
                direction={state.stepTransitionDirection}>
                {state.activeStep === 'profile' && <StepProfile />}
                {state.activeStep === 'interests' && <StepInterests />}
                {state.activeStep === 'suggested-accounts' && (
                  <StepSuggestedAccounts />
                )}
                {state.activeStep === 'suggested-starterpacks' && (
                  <StepSuggestedStarterpacks />
                )}
                {state.activeStep === 'finished' && <StepFinished />}
              </ScreenTransition>
            </Layout>
          </Context.Provider>
        </OnboardingHeaderSlot.Provider>
      </OnboardingControls.Provider>
    </Portal>
  )
}
