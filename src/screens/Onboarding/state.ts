import React from 'react'

import {logger} from '#/logger'
import {AvatarColor, Emoji} from '#/screens/Onboarding/StepProfile/types'

export type OnboardingState = {
  hasPrev: boolean
  totalSteps: number
  activeStep:
    | 'profile'
    | 'interests'
    | 'suggestedAccounts'
    | 'followingFeed'
    | 'algoFeeds'
    | 'topicalFeeds'
    | 'moderation'
    | 'profile'
    | 'finished'
  activeStepIndex: number

  interestsStepResults: {
    selectedInterests: string[]
    apiResponse: ApiResponseMap
  }
  suggestedAccountsStepResults: {
    accountDids: string[]
  }
  algoFeedsStepResults: {
    feedUris: string[]
  }
  topicalFeedsStepResults: {
    feedUris: string[]
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
      type: 'setSuggestedAccountsStepResults'
      accountDids: string[]
    }
  | {
      type: 'setAlgoFeedsStepResults'
      feedUris: string[]
    }
  | {
      type: 'setTopicalFeedsStepResults'
      feedUris: string[]
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

export const initialStateReduced: OnboardingState = {
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
  suggestedAccountsStepResults: {
    accountDids: [],
  },
  algoFeedsStepResults: {
    feedUris: [],
  },
  topicalFeedsStepResults: {
    feedUris: [],
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
  interestsDisplayNames: {[key: string]: string}
}>({
  state: {...initialStateReduced},
  dispatch: () => {},
  interestsDisplayNames: INTEREST_TO_DISPLAY_NAME_DEFAULTS,
})

export function reducerReduced(
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
      next = initialStateReduced
      break
    }
    case 'setInterestsStepResults': {
      next.interestsStepResults = {
        selectedInterests: a.selectedInterests,
        apiResponse: a.apiResponse,
      }
      break
    }
    case 'setSuggestedAccountsStepResults': {
      break
    }
    case 'setAlgoFeedsStepResults': {
      break
    }
    case 'setTopicalFeedsStepResults': {
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
    suggestedAccountsStepResults: state.suggestedAccountsStepResults,
    algoFeedsStepResults: state.algoFeedsStepResults,
    topicalFeedsStepResults: state.topicalFeedsStepResults,
    profileStepResults: state.profileStepResults,
  })

  if (s.activeStep !== state.activeStep) {
    logger.debug(`onboarding: step changed`, {activeStep: state.activeStep})
  }

  return state
}
