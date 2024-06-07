import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {useAgent, useSession} from 'state/session'

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

type TStateContext = [State, (action: Action) => void, () => Promise<void>]

const StateContext = React.createContext<TStateContext>([
  {} as State,
  (_: Action) => {},
  async () => {},
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
  initialState,
  initialStep = 'Details',
  children,
}: {
  initialState?: any // TODO update this type
  initialStep?: Step
  children: React.ReactNode
}) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  const [state, dispatch] = React.useReducer(
    reducer,
    initialState
      ? {
          ...initialState,
          step: initialStep,
        }
      : {
          canNext: false,
          currentStep: initialStep,
          profiles: [],
          feeds: [],
          processing: false,
        },
  )

  const submit = async () => {
    dispatch({type: 'SetProcessing', processing: true})

    try {
      const list = await agent.app.bsky.graph.list.create(
        {repo: currentAccount?.did},
        {
          name: state.name ?? '',
          description: state.description ?? '',
          descriptionFacets: [],
          avatar: undefined,
          createdAt: new Date().toISOString(),
          purpose: 'app.bsky.graph.defs#referencelist',
        },
      )

      await agent.com.atproto.repo.applyWrites({
        repo: currentAccount!.did,
        writes: state.profiles.map(p => ({
          $type: 'com.atproto.repo.applyWrites#create',
          collection: 'app.bsky.graph.listitem',
          value: {
            $type: 'app.bsky.graph.listitem',
            subject: p.did,
            list: list.uri,
            createdAt: new Date().toISOString(),
          },
        })),
      })

      await agent.app.bsky.graph.starterpack.create(
        {
          repo: currentAccount!.did,
          validate: false,
        },
        {
          name: state.name ?? '',
          description: state.description ?? '',
          descriptionFacets: [],
          list: list.uri,
          feeds: state.feeds.map(f => ({
            uri: f.uri,
          })),
          createdAt: new Date().toISOString(),
        },
      )
    } catch (e) {
      // TODO add error to state
      console.error(e)
    } finally {
      dispatch({type: 'SetProcessing', processing: false})
    }
  }

  return (
    <StateContext.Provider value={[state, dispatch, submit]}>
      {children}
    </StateContext.Provider>
  )
}

export {
  type Action as WizardAction,
  type State as WizardState,
  type Step as WizardStep,
}
