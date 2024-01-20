import React from 'react'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep:
    | 'interests'
    | 'suggestedFollows'
    | 'followingFeed'
    | 'algoFeeds'
    | 'topicalFeeds'
  activeStepIndex: number
}

export type OnboardingAction =
  | {
      type: 'next'
    }
  | {
      type: 'prev'
    }

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 5,
  activeStep: 'interests',
  activeStepIndex: 1,
}

export const Context = React.createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
}>({
  state: initialState,
  dispatch: () => {},
})
