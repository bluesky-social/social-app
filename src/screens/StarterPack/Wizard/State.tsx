import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

const steps = ['Landing', 'Details', 'Profiles', 'Feeds'] as const
type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetCanNext'; canNext: boolean}
  | {type: 'SetName'; name: string}
  | {type: 'SetDescription'; description: string}
  | {type: 'AddProfile'; profile: AppBskyActorDefs.ProfileViewBasic}
  | {type: 'RemoveProfile'; profileDid: string}
  | {type: 'AddFeed'; feed: GeneratorView}
  | {type: 'RemoveFeed'; feedUri: string}
  | {type: 'SetProcessing'; processing: boolean}

interface State {
  canNext: boolean
  currentStep: Step
  name?: string
  description?: string
  avatar?: string
  profiles: AppBskyActorDefs.ProfileViewBasic[]
  feeds: GeneratorView[]
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
  if (action.type === 'Next' && state.currentStep !== 'Feeds') {
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
      updatedState = {...state, profiles: [...state.profiles, action.profile]}
      break
    case 'RemoveProfile':
      updatedState = {
        ...state,
        profiles: state.profiles.filter(
          profile => profile.did !== action.profileDid,
        ),
      }
      break
    case 'AddFeed':
      updatedState = {...state, feeds: [...state.feeds, action.feed]}
      break
    case 'RemoveFeed':
      updatedState = {
        ...state,
        feeds: state.feeds.filter(f => f.uri !== action.feedUri),
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

// TODO supply the initial state to this component
export function Provider({
  initialState,
  initialStep = 'Landing',
  children,
}: {
  initialState?: any // TODO update this type
  initialStep?: Step
  children: React.ReactNode
}) {
  const stateAndReducer = React.useReducer(
    reducer,
    initialState
      ? {
          ...initialState,
          step: initialStep,
        }
      : {
          canNext: true,
          currentStep: initialStep,
          profiles: [],
          feeds: [],
          processing: false,
        },
  )

  return (
    <StateContext.Provider value={stateAndReducer}>
      {children}
    </StateContext.Provider>
  )
}

export {
  type Action as WizardAction,
  type State as WizardState,
  type Step as WizardStep,
}
