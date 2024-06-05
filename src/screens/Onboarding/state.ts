import {createContext, Dispatch} from 'react'

import {logger} from '#/logger'
import {AvatarColor, Emoji} from '#/screens/Onboarding/StepProfile/types'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep: 'profile' | 'interests' | 'finished'
  activeStepIndex: number

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
      apiResponse: ApiResponseMap
    }
  | {
      type: 'setProfileStepResults'
      isCreatedAvatar: boolean
      image?: OnboardingState['profileStepResults']['image']
      imageUri: string
      imageMime: string
      creatorState?: {
        emoji: Emoji
        backgroundColor: AvatarColor
      }
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

export const INTEREST_TO_DISPLAY_NAME_DEFAULTS: {
  [key: string]: string
} = {
  news: 'News',
  journalism: 'Journalism',
  nature: 'Nature',
  art: 'Art',
  comics: 'Comics',
  writers: 'Writers',
  culture: 'Culture',
  sports: 'Sports',
  pets: 'Pets',
  animals: 'Animals',
  books: 'Books',
  education: 'Education',
  climate: 'Climate',
  science: 'Science',
  politics: 'Politics',
  fitness: 'Fitness',
  tech: 'Tech',
  dev: 'Software Dev',
  comedy: 'Comedy',
  gaming: 'Video Games',
  food: 'Food',
  cooking: 'Cooking',
}

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 3,
  activeStep: 'profile',
  activeStepIndex: 1,

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

export const Context = createContext<{
  state: OnboardingState
  dispatch: Dispatch<OnboardingAction>
  interestsDisplayNames: {[key: string]: string}
}>({
  state: {...initialState},
  dispatch: () => {},
  interestsDisplayNames: INTEREST_TO_DISPLAY_NAME_DEFAULTS,
})

export function reducer(
  s: OnboardingState,
  a: OnboardingAction,
): OnboardingState {
  let next = {...s}

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
