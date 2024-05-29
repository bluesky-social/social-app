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

interface IStateContext {
  dispatch: (state: State, action: Action) => void
  state: State
}

const StateContext = React.createContext<IStateContext>({
  dispatch: (_: State, _: Action) => {},
  state: {
    currentStep: 'Landing',
  },
})
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
}

export function Provider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = React.useReducer(reducer, {
    currentStep: 'Landing',
  })

  return (
    <StateContext.Provider value={{state, dispatch}}>
      {children}
    </StateContext.Provider>
  )
}
