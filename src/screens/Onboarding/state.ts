import {createContext, useContext, useMemo} from 'react'

import {logger} from '#/logger'
import {
  type AvatarColor,
  type Emoji,
} from '#/screens/Onboarding/StepProfile/types'

type OnboardingScreen =
  | 'profile'
  | 'interests'
  | 'suggested-accounts'
  | 'suggested-starterpacks'
  | 'find-contacts-intro'
  | 'find-contacts'
  | 'finished'

export type OnboardingState = {
  screens: Record<OnboardingScreen, boolean>
  activeStep: OnboardingScreen
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
}

export type OnboardingAction =
  | {
      type: 'next'
    }
  | {
      type: 'prev'
    }
  | {
      type: 'skip-contacts'
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

export function createInitialOnboardingState(
  {
    starterPacksStepEnabled,
    findContactsStepEnabled,
  }: {
    starterPacksStepEnabled: boolean
    findContactsStepEnabled: boolean
  } = {starterPacksStepEnabled: true, findContactsStepEnabled: false},
): OnboardingState {
  const screens: OnboardingState['screens'] = {
    profile: true,
    interests: true,
    'suggested-accounts': true,
    'suggested-starterpacks': starterPacksStepEnabled,
    'find-contacts-intro': findContactsStepEnabled,
    'find-contacts': findContactsStepEnabled,
    finished: true,
  }

  return {
    screens,
    activeStep: 'profile',
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
}

export const Context = createContext<{
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
} | null>(null)
Context.displayName = 'OnboardingContext'

export function reducer(
  s: OnboardingState,
  a: OnboardingAction,
): OnboardingState {
  let next = {...s}

  const stepOrder = getStepOrder(s)

  switch (a.type) {
    case 'next': {
      const nextIndex = stepOrder.indexOf(next.activeStep) + 1
      const nextStep = stepOrder[nextIndex]
      if (nextStep) {
        next.activeStep = nextStep
      }
      next.stepTransitionDirection = 'Forward'
      break
    }
    case 'prev': {
      const prevIndex = stepOrder.indexOf(next.activeStep) - 1
      const prevStep = stepOrder[prevIndex]
      if (prevStep) {
        next.activeStep = prevStep
      }
      next.stepTransitionDirection = 'Backward'
      break
    }
    case 'skip-contacts': {
      const nextIndex = stepOrder.indexOf('find-contacts') + 1
      const nextStep = stepOrder[nextIndex] ?? 'finished'
      next.activeStep = nextStep
      next.stepTransitionDirection = 'Forward'
      break
    }
    case 'finish': {
      next = createInitialOnboardingState({
        starterPacksStepEnabled: s.screens['suggested-starterpacks'],
        findContactsStepEnabled: s.screens['find-contacts'],
      })
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

function getStepOrder(s: OnboardingState): OnboardingScreen[] {
  return [
    s.screens.profile && ('profile' as const),
    s.screens.interests && ('interests' as const),
    s.screens['suggested-accounts'] && ('suggested-accounts' as const),
    s.screens['suggested-starterpacks'] && ('suggested-starterpacks' as const),
    s.screens['find-contacts-intro'] && ('find-contacts-intro' as const),
    s.screens['find-contacts'] && ('find-contacts' as const),
    s.screens.finished && ('finished' as const),
  ].filter(x => !!x)
}

/**
 * Note: not to be confused with `useOnboardingState`, which just determines if onboarding is active.
 * This hook is for internal state of the onboarding flow (i.e. active step etc).
 *
 * This adds additional derived state to the onboarding context reducer.
 */
export function useOnboardingInternalState() {
  const ctx = useContext(Context)

  if (!ctx) {
    throw new Error(
      'useOnboardingInternalState must be used within OnboardingContext',
    )
  }

  const {state, dispatch} = ctx

  return {
    state: useMemo(() => {
      const stepOrder = getStepOrder(state).filter(
        x => x !== 'find-contacts' && x !== 'finished',
      ) as string[]
      const canGoBack = state.activeStep !== stepOrder[0]
      return {
        ...state,
        canGoBack,
        /**
         * Note: for *display* purposes only, do not lean on this
         * for navigation purposes! we merge certain steps!
         */
        activeStepIndex: stepOrder.indexOf(
          state.activeStep === 'find-contacts'
            ? 'find-contacts-intro'
            : state.activeStep,
        ),
        totalSteps: stepOrder.length,
      }
    }, [state]),
    dispatch,
  }
}
