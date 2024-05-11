import React from 'react'

import {logger} from '#/logger'

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
    image?: {
      path: string
      mime: string
      size: number
      width: number
      height: number
    }
    imageUri?: string
    imageMime?: string
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
      image?: OnboardingState['profileStepResults']['image']
      imageUri: string
      imageMime: string
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

export const initialState: OnboardingState = {
  hasPrev: false,
  totalSteps: 8,
  activeStep: 'interests',
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
    image: undefined,
    imageUri: '',
    imageMime: '',
  },
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

export const Context = React.createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
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
        next.activeStep = 'profile'
        next.activeStepIndex = 7
      } else if (s.activeStep === 'profile') {
        next.activeStep = 'finished'
        next.activeStepIndex = 8
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
      } else if (s.activeStep === 'profile') {
        next.activeStep = 'moderation'
        next.activeStepIndex = 6
      } else if (s.activeStep === 'finished') {
        next.activeStep = 'profile'
        next.activeStepIndex = 7
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
    case 'setSuggestedAccountsStepResults': {
      next.suggestedAccountsStepResults = {
        accountDids: next.suggestedAccountsStepResults.accountDids.concat(
          a.accountDids,
        ),
      }
      break
    }
    case 'setAlgoFeedsStepResults': {
      next.algoFeedsStepResults = {
        feedUris: a.feedUris,
      }
      break
    }
    case 'setTopicalFeedsStepResults': {
      next.topicalFeedsStepResults = {
        feedUris: next.topicalFeedsStepResults.feedUris.concat(a.feedUris),
      }
      break
    }
    case 'setProfileStepResults': {
      next.profileStepResults = {
        image: a.image,
        imageUri: a.imageUri,
        imageMime: a.imageMime,
      }
      break
    }
  }

  const state = {
    ...next,
    hasPrev: next.activeStep !== 'interests',
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
    image: undefined,
    imageUri: '',
    imageMime: '',
  },
}

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
        image: a.image,
        imageUri: a.imageUri,
        imageMime: a.imageMime,
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
