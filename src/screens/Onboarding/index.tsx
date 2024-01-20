import React from 'react'

import {logger} from '#/logger'
import {Portal} from '#/components/Portal'

import {
  Context,
  OnboardingState,
  OnboardingAction,
  initialState,
} from '#/screens/Onboarding/context'
import {Layout, OnboardingControls} from '#/screens/Onboarding/Layout'
import {StepInterests} from '#/screens/Onboarding/StepInterests'
import {StepSuggestedFollows} from '#/screens/Onboarding/StepSuggestedFollows'
import {StepFollowingFeed} from '#/screens/Onboarding/StepFollowingFeed'
import {StepAlgoFeeds} from '#/screens/Onboarding/StepAlgoFeeds'
import {StepTopicalFeeds} from '#/screens/Onboarding/StepTopicalFeeds'

function reducer(s: OnboardingState, a: OnboardingAction): OnboardingState {
  const next = s

  switch (a.type) {
    case 'next': {
      if (s.activeStep === 'interests') {
        next.activeStep = 'suggestedFollows'
        next.activeStepIndex = 2
      } else if (s.activeStep === 'suggestedFollows') {
        next.activeStep = 'followingFeed'
        next.activeStepIndex = 3
      } else if (s.activeStep === 'followingFeed') {
        next.activeStep = 'algoFeeds'
        next.activeStepIndex = 4
      } else if (s.activeStep === 'algoFeeds') {
        next.activeStep = 'topicalFeeds'
        next.activeStepIndex = 5
      }
      break
    }
    case 'prev': {
      if (s.activeStep === 'suggestedFollows') {
        next.activeStep = 'interests'
        next.activeStepIndex = 1
      } else if (s.activeStep === 'followingFeed') {
        next.activeStep = 'suggestedFollows'
        next.activeStepIndex = 2
      } else if (s.activeStep === 'algoFeeds') {
        next.activeStep = 'followingFeed'
        next.activeStepIndex = 3
      } else if (s.activeStep === 'topicalFeeds') {
        next.activeStep = 'algoFeeds'
        next.activeStepIndex = 4
      }
      break
    }
  }

  const state = {
    ...next,
    hasPrev: next.activeStep !== 'interests',
  }

  logger.debug(`onboarding`, state)

  return state
}

export function Onboarding() {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  return (
    <Portal>
      <OnboardingControls.Provider>
        <Context.Provider
          value={React.useMemo(() => ({state, dispatch}), [state, dispatch])}>
          <Layout>
            {state.activeStep === 'interests' && <StepInterests />}
            {state.activeStep === 'suggestedFollows' && (
              <StepSuggestedFollows />
            )}
            {state.activeStep === 'followingFeed' && <StepFollowingFeed />}
            {state.activeStep === 'algoFeeds' && <StepAlgoFeeds />}
            {state.activeStep === 'topicalFeeds' && <StepTopicalFeeds />}
          </Layout>
        </Context.Provider>
      </OnboardingControls.Provider>
    </Portal>
  )
}
