import React from 'react'

import {logger} from '#/logger'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep:
    | 'interests'
    | 'suggestedAccounts'
    | 'followingFeed'
    | 'algoFeeds'
    | 'topicalFeeds'
    | 'finished'
  activeStepIndex: number
  suggestedAccountHandles: string[]
}

export type OnboardingAction =
  | {
      type: 'next'
    }
  | {
      type: 'prev'
    }
  | {
      type: 'setSuggestedAccountHandles'
      suggestedAccountHandles: string[]
    }

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 6,
  activeStep: 'algoFeeds',
  activeStepIndex: 4,

  // result of interests step
  suggestedAccountHandles: [],
}

export const Context = React.createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
}>({
  state: initialState,
  dispatch: () => {},
})

export function reducer(
  s: OnboardingState,
  a: OnboardingAction,
): OnboardingState {
  const next = s

  switch (a.type) {
    case 'next': {
      if (s.activeStep === 'interests') {
        next.activeStep = 'suggestedAccounts'
        next.activeStepIndex = 2
      } else if (s.activeStep === 'suggestedAccounts') {
        next.activeStep = 'followingFeed'
        next.activeStepIndex = 3
      } else if (s.activeStep === 'followingFeed') {
        next.activeStep = 'algoFeeds'
        next.activeStepIndex = 4
      } else if (s.activeStep === 'algoFeeds') {
        next.activeStep = 'topicalFeeds'
        next.activeStepIndex = 5
      } else if (s.activeStep === 'topicalFeeds') {
        next.activeStep = 'finished'
        next.activeStepIndex = 6
      }
      break
    }
    case 'prev': {
      if (s.activeStep === 'suggestedAccounts') {
        next.activeStep = 'interests'
        next.activeStepIndex = 1
      } else if (s.activeStep === 'followingFeed') {
        next.activeStep = 'suggestedAccounts'
        next.activeStepIndex = 2
      } else if (s.activeStep === 'algoFeeds') {
        next.activeStep = 'followingFeed'
        next.activeStepIndex = 3
      } else if (s.activeStep === 'topicalFeeds') {
        next.activeStep = 'algoFeeds'
        next.activeStepIndex = 4
      } else if (s.activeStep === 'finished') {
        next.activeStep = 'topicalFeeds'
        next.activeStepIndex = 5
      }
      break
    }
    case 'setSuggestedAccountHandles': {
      next.suggestedAccountHandles = a.suggestedAccountHandles
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
