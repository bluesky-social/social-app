import React from 'react'

const steps = [
  'Landing',
  'Details',
  'Profiles',
  'Feeds',
  'Review',
  'Finished',
] as const
type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetDetails'; name: string; description?: string; avatar?: string}
  | {type: 'AddProfile'}

interface State {
  currentStep: Step
  name?: string
  description?: string
  avatar?: string
}

type TStateContext = [State, (action: Action) => void]

const StateContext = React.createContext<TStateContext>([
  {
    currentStep: 'Landing',
  },
  (_: Action) => {},
])
export const useWizardState = () => React.useContext(StateContext)

function reducer(state: State, action: Action): State {
  // -- Navigation
  if (action.type === 'Next' && state.currentStep !== 'Finished') {
    const currentIndex = steps.indexOf(state.currentStep)
    return {...state, currentStep: steps[currentIndex + 1]}
  } else if (action.type === 'Back' && state.currentStep !== 'Landing') {
    const currentIndex = steps.indexOf(state.currentStep)
    return {...state, currentStep: steps[currentIndex - 1]}
  }

  // -- Details
  if (action.type === 'SetDetails') {
    return {
      ...state,
      name: action.name,
      description: action.description,
      avatar: action.avatar,
    }
  }

  // -- Profiles
  if (action.type === 'AddProfile') {
    return state
  }

  return state
}

export function Provider({children}: {children: React.ReactNode}) {
  const stateAndReducer = React.useReducer(reducer, {
    currentStep: 'Landing',
  })

  return (
    <StateContext.Provider value={stateAndReducer}>
      {children}
    </StateContext.Provider>
  )
}
