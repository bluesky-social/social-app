import React from 'react'

import {Portal} from '#/components/Portal'

import {Context, initialState, reducer} from '#/screens/Onboarding/state'
import {Layout, OnboardingControls} from '#/screens/Onboarding/Layout'
import {StepInterests} from '#/screens/Onboarding/StepInterests'
import {StepSuggestedAccounts} from '#/screens/Onboarding/StepSuggestedAccounts'
import {StepFollowingFeed} from '#/screens/Onboarding/StepFollowingFeed'
import {StepAlgoFeeds} from '#/screens/Onboarding/StepAlgoFeeds'
import {StepTopicalFeeds} from '#/screens/Onboarding/StepTopicalFeeds'
import {StepFinished} from '#/screens/Onboarding/StepFinished'
import {StepModeration} from '#/screens/Onboarding/StepModeration'

export function Onboarding() {
  const [state, dispatch] = React.useReducer(reducer, {...initialState})

  return (
    <Portal>
      <OnboardingControls.Provider>
        <Context.Provider
          value={React.useMemo(() => ({state, dispatch}), [state, dispatch])}>
          <Layout>
            {state.activeStep === 'interests' && <StepInterests />}
            {state.activeStep === 'suggestedAccounts' && (
              <StepSuggestedAccounts />
            )}
            {state.activeStep === 'followingFeed' && <StepFollowingFeed />}
            {state.activeStep === 'algoFeeds' && <StepAlgoFeeds />}
            {state.activeStep === 'topicalFeeds' && <StepTopicalFeeds />}
            {state.activeStep === 'moderation' && <StepModeration />}
            {state.activeStep === 'finished' && <StepFinished />}
          </Layout>
        </Context.Provider>
      </OnboardingControls.Provider>
    </Portal>
  )
}
