import React from 'react'

import {logger} from '#/logger'
import {
  type AvatarColor,
  type Emoji,
} from '#/screens/Onboarding/StepProfile/types'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep:
    | 'profile'
    | 'interests'
    | 'suggested-accounts'
    | 'suggested-starterpacks'
    | 'finished'
  activeStepIndex: number
  stepTransitionDirection: 'Forward' | 'Backward'

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
    onboarding_suggested_starterpacks?: boolean
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
  stepTransitionDirection: 'Forward',

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

  const stepOrder: OnboardingState['activeStep'][] = [
    'profile',
    'interests',
    ...(s.experiments?.onboarding_suggested_accounts
      ? (['suggested-accounts'] as const)
      : []),
    ...(s.experiments?.onboarding_suggested_starterpacks
      ? (['suggested-starterpacks'] as const)
      : []),
    'finished',
  ]

  switch (a.type) {
    case 'next': {
      // 1-indexed for some reason
      const nextIndex = s.activeStepIndex
      const nextStep = stepOrder[nextIndex]
      if (nextStep) {
        next.activeStep = nextStep
        next.activeStepIndex = nextIndex + 1
      }
      next.stepTransitionDirection = 'Forward'
      break
    }
    case 'prev': {
      const prevIndex = s.activeStepIndex - 2
      const prevStep = stepOrder[prevIndex]
      if (prevStep) {
        next.activeStep = prevStep
        next.activeStepIndex = prevIndex + 1
      }
      next.stepTransitionDirection = 'Backward'
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
