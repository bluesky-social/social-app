import {useMemo, useReducer} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGate} from '#/lib/statsig/statsig'
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
import {ENV} from '#/env'
import {StepSuggestedAccounts} from './StepSuggestedAccounts'

export function Onboarding() {
  const {_} = useLingui()
  const gate = useGate()
  const showValueProp = ENV !== 'e2e' && gate('onboarding_value_prop')
  const showSuggestedAccounts =
    ENV !== 'e2e' && gate('onboarding_suggested_accounts')
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    totalSteps: showSuggestedAccounts ? 4 : 3,
    experiments: {
      onboarding_suggested_accounts: showSuggestedAccounts,
      onboarding_value_prop: showValueProp,
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
              {state.activeStep === 'profile' && <StepProfile />}
              {state.activeStep === 'interests' && <StepInterests />}
              {state.activeStep === 'suggested-accounts' && (
                <StepSuggestedAccounts />
              )}
              {state.activeStep === 'finished' && <StepFinished />}
            </Layout>
          </Context.Provider>
        </OnboardingHeaderSlot.Provider>
      </OnboardingControls.Provider>
    </Portal>
  )
}
