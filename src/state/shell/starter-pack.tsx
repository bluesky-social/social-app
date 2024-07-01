import React from 'react'
import {nanoid} from 'nanoid/non-secure'

type StateContext =
  | {
      uri: string
      isClip?: boolean
      starterPackUserID: string
    }
  | undefined

type SetContext = (
  v: {uri: string; isClip?: boolean; starterPackUserID?: string} | undefined,
) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>(_ => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>()

  const setStateWrapped = (
    v: {uri: string; isClip?: boolean; starterPackUserID?: string} | undefined,
  ) => {
    if (v) {
      let userID = v.starterPackUserID
      if (!userID) {
        userID = nanoid(16).replace('_', '-')
      }
      setState({...v, starterPackUserID: userID})
    } else {
      setState(undefined)
    }
  }

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useActiveStarterPack = () => React.useContext(stateContext)
export const useSetActiveStarterPack = () => React.useContext(setContext)
