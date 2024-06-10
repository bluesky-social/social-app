import React from 'react'
import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg} from '@lingui/macro'

import * as Toast from '#/view/com/util/Toast'

const steps = ['Details', 'Profiles', 'Feeds'] as const
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
  | {type: 'SetError'; error: string}

interface State {
  canNext: boolean
  currentStep: Step
  name?: string
  description?: string
  profiles: AppBskyActorDefs.ProfileViewBasic[]
  feeds: GeneratorView[]
  processing: boolean
  error?: string
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
  const currentIndex = steps.indexOf(state.currentStep)
  if (action.type === 'Next' && state.currentStep !== 'Feeds') {
    updatedState = {...state, currentStep: steps[currentIndex + 1]}
  } else if (action.type === 'Back' && state.currentStep !== 'Details') {
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
      if (state.profiles.length >= 51) {
        Toast.show(msg`You may only add up to 50 profiles`.message ?? '')
      } else {
        updatedState = {...state, profiles: [...state.profiles, action.profile]}
      }
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
      if (state.feeds.length >= 50) {
        Toast.show(msg`You may only add up to 50 feeds`.message ?? '')
      } else {
        updatedState = {...state, feeds: [...state.feeds, action.feed]}
      }
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
    case 'Details':
      updatedState = {
        ...updatedState,
        canNext: Boolean(updatedState.description),
      }
      break
    default: {
      updatedState = {
        ...updatedState,
        canNext: true,
      }
    }
  }

  return updatedState
}

// TODO supply the initial state to this component
export function Provider({
  starterPack,
  profiles,
  children,
}: {
  starterPack?: AppBskyGraphDefs.StarterPackView
  profiles?: AppBskyActorDefs.ProfileViewBasic[]
  children: React.ReactNode
}) {
  const createInitialState = (): State => {
    if (starterPack && AppBskyGraphStarterpack.isRecord(starterPack.record)) {
      return {
        canNext: true,
        currentStep: 'Details',
        name: starterPack.record.name,
        description: starterPack.record.description,
        profiles: profiles ?? [],
        feeds: starterPack.feeds ?? [],
        processing: false,
      }
    }

    return {
      canNext: false,
      currentStep: 'Details',
      profiles: [],
      feeds: [],
      processing: false,
    }
  }

  const [state, dispatch] = React.useReducer(reducer, createInitialState())

  return (
    <StateContext.Provider value={[state, dispatch]}>
      {children}
    </StateContext.Provider>
  )
}

export {
  type Action as WizardAction,
  type State as WizardState,
  type Step as WizardStep,
}
