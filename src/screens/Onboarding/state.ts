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
  totalSteps: 7,
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
  })

  if (s.activeStep !== state.activeStep) {
    logger.info(`onboarding: step changed`, {activeStep: state.activeStep})
  }

  return state
}
