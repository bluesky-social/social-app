import React from 'react'
import {type AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {type GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg, plural} from '@lingui/macro'

import {STARTER_PACK_MAX_SIZE} from '#/lib/constants'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import * as bsky from '#/types/bsky'

const steps = ['Details', 'Profiles', 'Feeds'] as const
type Step = (typeof steps)[number]

type Action =
  | {type: 'Next'}
  | {type: 'Back'}
  | {type: 'SetCanNext'; canNext: boolean}
  | {type: 'SetName'; name: string}
  | {type: 'SetDescription'; description: string}
  | {type: 'AddProfile'; profile: bsky.profile.AnyProfileView}
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
  profiles: bsky.profile.AnyProfileView[]
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
  if (action.type === 'Next' && state.currentStep !== 'Feeds') {
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
      updatedState = {...state, name: action.name.slice(0, 50)}
      break
    case 'SetDescription':
      updatedState = {...state, description: action.description}
      break
    case 'AddProfile':
      if (state.profiles.length > STARTER_PACK_MAX_SIZE) {
        Toast.show(
          msg`You may only add up to ${plural(STARTER_PACK_MAX_SIZE, {
            other: `${STARTER_PACK_MAX_SIZE} profiles`,
          })}`.message ?? '',
          'info',
        )
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
      if (state.feeds.length >= 3) {
        Toast.show(msg`You may only add up to 3 feeds`.message ?? '', 'info')
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

  return updatedState
}

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
    if (
      starterPack &&
      bsky.validate(starterPack.record, AppBskyGraphStarterpack.validateRecord)
    ) {
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
