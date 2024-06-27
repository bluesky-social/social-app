import React from 'react'
import {nanoid} from 'nanoid/non-secure'

type StateContext =
  | {
      uri: string
      isClip?: boolean
      starterPackUserID?: string
    }
  | undefined
type SetContext = (v: StateContext) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>()

  const setStateWrapped = (v: StateContext) => {
    if (v) {
      let userID = v.starterPackUserID
      if (!userID) {
        userID = nanoid(16)
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
