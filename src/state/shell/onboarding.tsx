import React from 'react'

import * as persisted from '#/state/persisted'

export const OnboardingScreenSteps = {
  Welcome: 'Welcome',
  RecommendedFeeds: 'RecommendedFeeds',
  RecommendedFollows: 'RecommendedFollows',
  Home: 'Home',
} as const

type OnboardingStep =
  (typeof OnboardingScreenSteps)[keyof typeof OnboardingScreenSteps]
const OnboardingStepsArray = Object.values(OnboardingScreenSteps)

type Action =
  | {type: 'set'; step: OnboardingStep}
  | {type: 'next'; currentStep?: OnboardingStep}
  | {type: 'start'}
  | {type: 'finish'}
  | {type: 'skip'}

export type StateContext = persisted.Schema['onboarding'] & {
  isComplete: boolean
  isActive: boolean
}
export type DispatchContext = (action: Action) => void

const stateContext = React.createContext<StateContext>(
  compute(persisted.defaults.onboarding),
)
const dispatchContext = React.createContext<DispatchContext>((_: Action) => {})

function reducer(state: StateContext, action: Action): StateContext {
  switch (action.type) {
    case 'set': {
      if (OnboardingStepsArray.includes(action.step)) {
        persisted.write('onboarding', {step: action.step})
        return compute({...state, step: action.step})
      }
      return state
    }
    case 'next': {
      const currentStep = action.currentStep || state.step
      let nextStep = 'Home'
      if (currentStep === 'Welcome') {
        nextStep = 'RecommendedFeeds'
      } else if (currentStep === 'RecommendedFeeds') {
        nextStep = 'RecommendedFollows'
      } else if (currentStep === 'RecommendedFollows') {
        nextStep = 'Home'
      }
      persisted.write('onboarding', {step: nextStep})
      return compute({...state, step: nextStep})
    }
    case 'start': {
      persisted.write('onboarding', {step: 'Welcome'})
      return compute({...state, step: 'Welcome'})
    }
    case 'finish': {
      persisted.write('onboarding', {step: 'Home'})
      return compute({...state, step: 'Home'})
    }
    case 'skip': {
      persisted.write('onboarding', {step: 'Home'})
      return compute({...state, step: 'Home'})
    }
    default: {
      throw new Error('Invalid action')
    }
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(
    reducer,
    compute(persisted.get('onboarding')),
  )

  React.useEffect(() => {
    return persisted.onUpdate('onboarding', nextOnboarding => {
      const next = nextOnboarding.step
      // TODO we've introduced a footgun
      if (state.step !== next) {
        dispatch({
          type: 'set',
          step: nextOnboarding.step as OnboardingStep,
        })
      }
    })
  }, [state, dispatch])

  return (
    <stateContext.Provider value={state}>
      <dispatchContext.Provider value={dispatch}>
        {children}
      </dispatchContext.Provider>
    </stateContext.Provider>
  )
}

export function useOnboardingState() {
  return React.useContext(stateContext)
}

export function useOnboardingDispatch() {
  return React.useContext(dispatchContext)
}

export function isOnboardingActive() {
  return compute(persisted.get('onboarding')).isActive
}

function compute(state: persisted.Schema['onboarding']): StateContext {
  return {
    ...state,
    isActive: state.step !== 'Home',
    isComplete: state.step === 'Home',
  }
}
