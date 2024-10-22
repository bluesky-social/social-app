import React from 'react'
import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {useSession} from '#/state/session'

const steps = ['Details'] as const
type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetCanNext'; canNext: boolean}
  | {type: 'SetName'; name: string}
  | {type: 'SetDescription'; description: string}
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
  transitionDirection: 'Backward' | 'Forward'
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
  if (action.type === 'Next') {
    updatedState = {
      ...state,
      currentStep: steps[currentIndex + 1],
      transitionDirection: 'Forward',
    }
  } else if (action.type === 'Back' && state.currentStep !== 'Details') {
    updatedState = {
      ...state,
      currentStep: steps[currentIndex - 1],
      transitionDirection: 'Backward',
    }
  }

  switch (action.type) {
    case 'SetName':
      updatedState = {...state, name: action.name.slice(0, 24)}
      break
    case 'SetDescription':
      updatedState = {...state, description: action.description}
      break
    case 'SetProcessing':
      updatedState = {...state, processing: action.processing}
      break
  }

  return updatedState
}

// TODO supply the initial state to this component
export function Provider({
  starterPack,
  listItems,
  children,
}: {
  starterPack?: AppBskyGraphDefs.StarterPackView
  listItems?: AppBskyGraphDefs.ListItemView[]
  children: React.ReactNode
}) {
  const {currentAccount} = useSession()

  const createInitialState = (): State => {
    if (starterPack && AppBskyGraphStarterpack.isRecord(starterPack.record)) {
      return {
        canNext: true,
        currentStep: 'Details',
        name: starterPack.record.name,
        description: starterPack.record.description,
        profiles:
          listItems
            ?.map(i => i.subject)
            .filter(p => p.did !== currentAccount?.did) ?? [],
        feeds: starterPack.feeds ?? [],
        processing: false,
        transitionDirection: 'Forward',
      }
    }

    return {
      canNext: true,
      currentStep: 'Details',
      profiles: [],
      feeds: [],
      processing: false,
      transitionDirection: 'Forward',
    }
  }

  const [state, dispatch] = React.useReducer(reducer, null, createInitialState)

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
