import React from 'react'

import {logger} from '#/logger'
import {
  type AvatarColor,
  type Emoji,
} from '#/screens/Onboarding/StepProfile/types'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep: 'profile' | 'interests' | 'suggested-accounts' | 'finished'
  activeStepIndex: number

  interestsStepResults: {
    selectedInterests: string[]
  }
  profileStepResults: {
    isCreatedAvatar: boolean
    image?: {
      path: string
      mime: string
      size: number
      width: number
      height: number
    }
    imageUri?: string
    imageMime?: string
    creatorState?: {
      emoji: Emoji
      backgroundColor: AvatarColor
    }
  }

  experiments?: {
    onboarding_suggested_accounts?: boolean
    onboarding_value_prop?: boolean
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
      selectedInterests: string[]
    }
  | {
      type: 'setProfileStepResults'
      isCreatedAvatar: boolean
      image: OnboardingState['profileStepResults']['image'] | undefined
      imageUri: string | undefined
      imageMime: string
      creatorState:
        | {
            emoji: Emoji
            backgroundColor: AvatarColor
          }
        | undefined
    }

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 3,
  activeStep: 'profile',
  activeStepIndex: 1,

  interestsStepResults: {
    selectedInterests: [],
  },
  profileStepResults: {
    isCreatedAvatar: false,
    image: undefined,
    imageUri: '',
    imageMime: '',
  },
}

export const Context = React.createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
}>({
  state: {...initialState},
  dispatch: () => {},
})
Context.displayName = 'OnboardingContext'

export function reducer(
  s: OnboardingState,
  a: OnboardingAction,
): OnboardingState {
  let next = {...s}

  switch (a.type) {
    case 'next': {
      if (s.experiments?.onboarding_suggested_accounts) {
        if (s.activeStep === 'profile') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'interests') {
          next.activeStep = 'suggested-accounts'
          next.activeStepIndex = 3
        }
        if (s.activeStep === 'suggested-accounts') {
          next.activeStep = 'finished'
          next.activeStepIndex = 4
        }
      } else {
        if (s.activeStep === 'profile') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'interests') {
          next.activeStep = 'finished'
          next.activeStepIndex = 3
        }
      }
      break
    }
    case 'prev': {
      if (s.experiments?.onboarding_suggested_accounts) {
        if (s.activeStep === 'interests') {
          next.activeStep = 'profile'
          next.activeStepIndex = 1
        } else if (s.activeStep === 'suggested-accounts') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        } else if (s.activeStep === 'finished') {
          next.activeStep = 'suggested-accounts'
          next.activeStepIndex = 3
        }
      } else {
        if (s.activeStep === 'interests') {
          next.activeStep = 'profile'
          next.activeStepIndex = 1
        } else if (s.activeStep === 'finished') {
          next.activeStep = 'interests'
          next.activeStepIndex = 2
        }
      }
      break
    }
    case 'finish': {
      next = initialState
      break
    }
    case 'setInterestsStepResults': {
      next.interestsStepResults = {
        selectedInterests: a.selectedInterests,
      }
      break
    }
    case 'setProfileStepResults': {
      next.profileStepResults = {
        isCreatedAvatar: a.isCreatedAvatar,
        image: a.image,
        imageUri: a.imageUri,
        imageMime: a.imageMime,
        creatorState: a.creatorState,
      }
      break
    }
  }

  const state = {
    ...next,
    hasPrev: next.activeStep !== 'profile',
  }

  logger.debug(`onboarding`, {
    hasPrev: state.hasPrev,
    activeStep: state.activeStep,
    activeStepIndex: state.activeStepIndex,
    interestsStepResults: {
      selectedInterests: state.interestsStepResults.selectedInterests,
    },
    profileStepResults: state.profileStepResults,
  })

  if (s.activeStep !== state.activeStep) {
    logger.debug(`onboarding: step changed`, {activeStep: state.activeStep})
  }

  return state
}
