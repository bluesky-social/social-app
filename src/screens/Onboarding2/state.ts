import React from 'react'

import { logger } from '#/logger'
import {
  type AvatarColor,
  type Emoji,
} from '#/screens/Onboarding2/StepProfile/types'

export type Onboarding2State = {
  hasPrev: boolean
  totalSteps: number
  activeStep: 'profile' | 'interests' | 'finished'
  activeStepIndex: number
  isLoading: boolean

  interestsStepResults: {
    selectedInterests: string[]
    apiResponse: ApiResponseMap
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
}

export type Onboarding2Action =
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
      type: 'setIsLoading'
      value: boolean
    }
  | {
      type: 'setInterestsStepResults'
      selectedInterests: string[]
      apiResponse: ApiResponseMap
    }
  | {
      type: 'setProfileStepResults'
      isCreatedAvatar: boolean
      image: Onboarding2State['profileStepResults']['image'] | undefined
      imageUri: string | undefined
      imageMime: string
      creatorState:
        | {
            emoji: Emoji
            backgroundColor: AvatarColor
          }
        | undefined
    }

export type ApiResponseMap = {
  interests: string[]
  suggestedAccountDids: {
    [key: string]: string[]
  }
  suggestedFeedUris: {
    [key: string]: string[]
  }
}

export const initialState: Onboarding2State = {
  hasPrev: false,
  totalSteps: 3,
  activeStep: 'profile',
  activeStepIndex: 1,
  isLoading: false,

  interestsStepResults: {
    selectedInterests: [],
    apiResponse: {
      interests: [],
      suggestedAccountDids: {},
      suggestedFeedUris: {},
    },
  },
  profileStepResults: {
    isCreatedAvatar: false,
    image: undefined,
    imageUri: '',
    imageMime: '',
  },
}

export const Context = React.createContext<{
  state: Onboarding2State
  dispatch: React.Dispatch<Onboarding2Action>
}>({
  state: { ...initialState },
  dispatch: () => {},
})

export function reducer(
  s: Onboarding2State,
  a: Onboarding2Action,
): Onboarding2State {
  let next = { ...s }

  switch (a.type) {
    case 'next': {
      if (s.activeStep === 'profile') {
        next.activeStep = 'interests'
        next.activeStepIndex = 2
      } else if (s.activeStep === 'interests') {
        next.activeStep = 'finished'
        next.activeStepIndex = 3
      }
      break
    }
    case 'prev': {
      if (s.activeStep === 'interests') {
        next.activeStep = 'profile'
        next.activeStepIndex = 1
      } else if (s.activeStep === 'finished') {
        next.activeStep = 'interests'
        next.activeStepIndex = 2
      }
      break
    }
    case 'finish': {
      next = initialState
      break
    }
    case 'setIsLoading': {
      next.isLoading = a.value
      break
    }
    case 'setInterestsStepResults': {
      next.interestsStepResults = {
        selectedInterests: a.selectedInterests,
        apiResponse: a.apiResponse,
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

  logger.debug(`onboarding2`, {
    hasPrev: state.hasPrev,
    activeStep: state.activeStep,
    activeStepIndex: state.activeStepIndex,
    interestsStepResults: {
      selectedInterests: state.interestsStepResults.selectedInterests,
    },
    profileStepResults: state.profileStepResults,
  })

  if (s.activeStep !== state.activeStep) {
    logger.debug(`onboarding2: step changed`, { activeStep: state.activeStep })
  }

  return state
}
