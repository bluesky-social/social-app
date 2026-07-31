import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
} from 'react'

import {logger} from '#/logger'

type StarterPackLanding = {
  type: 'starterpack'
  uri: string
  isClip?: boolean
}

type GroupChatJoinRequestLanding = {
  type: 'groupchat'
  uri: string
  code: string
}

type LandingType = StarterPackLanding | GroupChatJoinRequestLanding | undefined

type SetContext = Dispatch<SetStateAction<LandingType>>

const stateContext = createContext<LandingType>(undefined)
stateContext.displayName = 'ActiveLandingStateContext'
const setContext = createContext<SetContext>(() => {})
setContext.displayName = 'ActiveLandingSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<LandingType>()

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

// Core hooks
export const useActiveLanding = () => useContext(stateContext)
export const useSetActiveLanding = () => useContext(setContext)

// Filtered hooks for convenience
export const useActiveStarterPack = () => {
  const landing = useActiveLanding()
  return landing?.type === 'starterpack' ? landing : undefined
}

export const useSetActiveStarterPack = () => {
  const setLanding = useSetActiveLanding()
  return (pack: {uri: string; isClip?: boolean} | undefined) => {
    if (!pack) {
      setLanding(undefined)
    } else {
      setLanding(currentLanding => {
        if (currentLanding && currentLanding.type !== 'starterpack') {
          logger.debug(
            `[landing] Replacing ${currentLanding.type} landing with starterpack`,
          )
        }
        return {type: 'starterpack', ...pack}
      })
    }
  }
}

export const useActiveGroupChatJoinRequest = () => {
  const landing = useActiveLanding()
  return landing?.type === 'groupchat' ? landing : undefined
}
