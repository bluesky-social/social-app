import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'

const steps = [
  'Landing',
  'Details',
  'Profiles',
  'Feeds',
  'Review',
  'Finished',
] as const
export type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetCanNext'; canNext: boolean}
  | {type: 'SetName'; name: string}
  | {type: 'SetDescription'; description: string}
  | {type: 'AddProfile'}

interface State {
  canNext: boolean
  currentStep: Step
  name?: string
  description?: string
  avatar?: string
  profiles: AppBskyActorDefs.ProfileViewBasic[]
}

type TStateContext = [State, (action: Action) => void]

const StateContext = React.createContext<TStateContext>([
  {} as State,
  (_: Action) => {},
])
export const useWizardState = () => React.useContext(StateContext)

function reducer(state: State, action: Action): State {
  let updatedState = state

  // -- Navigation
  if (action.type === 'Next' && state.currentStep !== 'Finished') {
    const currentIndex = steps.indexOf(state.currentStep)
    updatedState = {...state, currentStep: steps[currentIndex + 1]}
  } else if (action.type === 'Back' && state.currentStep !== 'Landing') {
    const currentIndex = steps.indexOf(state.currentStep)
    updatedState = {...state, currentStep: steps[currentIndex - 1]}
  }

  switch (action.type) {
    case 'SetName':
      updatedState = {...state, name: action.name}
      break
    case 'SetDescription':
      updatedState = {...state, description: action.description}
      break
    case 'AddProfile':
      break
  }

  switch (updatedState.currentStep) {
    case 'Landing':
      updatedState = {
        ...updatedState,
        canNext: true,
      }
      break
    case 'Details':
      updatedState = {
        ...updatedState,
        canNext: Boolean(updatedState.description),
      }
      break
  }

  return updatedState
}

export function Provider({children}: {children: React.ReactNode}) {
  const stateAndReducer = React.useReducer(reducer, {
    canNext: true,
    currentStep: 'Landing',
    profiles: [],
  })

  return (
    <StateContext.Provider value={stateAndReducer}>
      {children}
    </StateContext.Provider>
  )
}
