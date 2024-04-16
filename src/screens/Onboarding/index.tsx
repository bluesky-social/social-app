import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Layout, OnboardingControls} from '#/screens/Onboarding/Layout'
import {
  Context,
  initialState,
  initialStateV2,
  reducer,
  reducerV2,
} from '#/screens/Onboarding/state'
import {StepAlgoFeeds} from '#/screens/Onboarding/StepAlgoFeeds'
import {StepFinished} from '#/screens/Onboarding/StepFinished'
import {StepFollowingFeed} from '#/screens/Onboarding/StepFollowingFeed'
import {StepInterests} from '#/screens/Onboarding/StepInterests'
import {StepModeration} from '#/screens/Onboarding/StepModeration'
import {StepProfile} from '#/screens/Onboarding/StepProfile'
import {StepSuggestedAccounts} from '#/screens/Onboarding/StepSuggestedAccounts'
import {StepTopicalFeeds} from '#/screens/Onboarding/StepTopicalFeeds'
import {Portal} from '#/components/Portal'

export function Onboarding() {
  const {_} = useLingui()
  const isV2Enabled = false // TODO replace with feature flag
  const [state, dispatch] = React.useReducer(
    isV2Enabled ? reducerV2 : reducer,
    isV2Enabled ? {...initialStateV2} : {...initialState},
  )

  const interestsDisplayNames = React.useMemo(() => {
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
      photography: _(msg`Photography`),
    }
  }, [_])

  return (
    <Portal>
      <OnboardingControls.Provider>
        <Context.Provider
          value={React.useMemo(
            () => ({state, dispatch, interestsDisplayNames}),
            [state, dispatch, interestsDisplayNames],
          )}>
          <Layout>
            {state.activeStep === 'interests' && <StepInterests />}
            {state.activeStep === 'suggestedAccounts' && (
              <StepSuggestedAccounts />
            )}
            {state.activeStep === 'followingFeed' && <StepFollowingFeed />}
            {state.activeStep === 'algoFeeds' && <StepAlgoFeeds />}
            {state.activeStep === 'topicalFeeds' && <StepTopicalFeeds />}
            {state.activeStep === 'moderation' && <StepModeration />}
            {state.activeStep === 'profile' && <StepProfile />}
            {state.activeStep === 'finished' && <StepFinished />}
          </Layout>
        </Context.Provider>
      </OnboardingControls.Provider>
    </Portal>
  )
}
