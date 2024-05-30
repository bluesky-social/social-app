import React from 'react'

const steps = ['Landing', 'Details', 'Profiles', 'Feeds', 'Finished'] as const
export type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetCanNext'; canNext: boolean}
  | {type: 'SetName'; name: string}
  | {type: 'SetDescription'; description: string}
  | {type: 'AddProfile'; did: string}
  | {type: 'RemoveProfile'; did: string}
  | {type: 'AddFeed'; uri: string}
  | {type: 'RemoveFeed'; uri: string}
  | {type: 'SetProcessing'; processing: boolean}

interface State {
  canNext: boolean
  currentStep: Step
  name?: string
  description?: string
  avatar?: string
  profileDids: string[]
  feedUris: string[]
  processing: boolean
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
      updatedState = {...state, profileDids: [...state.profileDids, action.did]}
      break
    case 'RemoveProfile':
      updatedState = {
        ...state,
        profileDids: state.profileDids.filter(did => did !== action.did),
      }
      break
    case 'AddFeed':
      updatedState = {...state, feedUris: [...state.feedUris, action.uri]}
      break
    case 'RemoveFeed':
      updatedState = {
        ...state,
        feedUris: state.feedUris.filter(uri => uri !== action.uri),
      }
      break
    case 'SetProcessing':
      updatedState = {...state, processing: action.processing}
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
    profileDids: [],
    feedUris: [],
    processing: false,
  })

  return (
    <StateContext.Provider value={stateAndReducer}>
      {children}
    </StateContext.Provider>
  )
}
