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
    | 'moderation'
    | 'finished'
  activeStepIndex: number

  // result of interest step
  interestsStepResults: {
    interests: string[]
    suggestedAccountHandles: string[]
    suggestedFeedUris: string[]
  }
}

export type OnboardingAction =
  | {
      type: 'next'
    }
  | {
      type: 'prev'
    }
  | {
      type: 'finish'
    }
  | {
      type: 'setInterestsStepResults'
      interests: string[]
      suggestedAccountHandles: string[]
      suggestedFeedUris: string[]
    }

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 6,
  activeStep: 'interests',
  activeStepIndex: 1,

  interestsStepResults: {
    interests: [],
    suggestedAccountHandles: [],
    suggestedFeedUris: [],
  },
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
  let next = s

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
        next.activeStep = 'moderation'
        next.activeStepIndex = 6
      } else if (s.activeStep === 'moderation') {
        next.activeStep = 'finished'
        next.activeStepIndex = 7
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
      } else if (s.activeStep === 'moderation') {
        next.activeStep = 'topicalFeeds'
        next.activeStepIndex = 5
      } else if (s.activeStep === 'finished') {
        next.activeStep = 'moderation'
        next.activeStepIndex = 6
      }
      break
    }
    case 'finish': {
      next = initialState
      break
    }
    case 'setInterestsStepResults': {
      next.interestsStepResults = {
        interests: a.interests,
        suggestedAccountHandles: a.suggestedAccountHandles,
        suggestedFeedUris: a.suggestedFeedUris,
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
