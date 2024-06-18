import React, {useEffect} from 'react'

import * as persisted from '#/state/persisted'
import {useAgent, useSession} from '../session'

type StateContext = Map<string, boolean>
type SetStateContext = (uri: string, value: boolean) => void

const stateContext = React.createContext<StateContext>(new Map())
const setStateContext = React.createContext<SetStateContext>(
  (_: string) => false,
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>(() => new Map())

  const setThreadMute = React.useCallback(
    (uri: string, value: boolean) => {
      setState(prev => {
        const next = new Map(prev)
        next.set(uri, value)
        return next
      })
    },
    [setState],
  )

  useMigrateMutes(setThreadMute)

  return (
    <stateContext.Provider value={state}>
      <setStateContext.Provider value={setThreadMute}>
        {children}
      </setStateContext.Provider>
    </stateContext.Provider>
  )
}

export function useMutedThreads() {
  return React.useContext(stateContext)
}

export function useIsThreadMuted(uri: string, defaultValue = false) {
  const state = React.useContext(stateContext)
  return state.get(uri) ?? defaultValue
}

export function useSetThreadMute() {
  return React.useContext(setStateContext)
}

function useMigrateMutes(setThreadMute: SetStateContext) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  useEffect(() => {
    if (currentAccount) {
      if (
        !persisted
          .get('mutedThreads')
          .some(uri => uri.includes(currentAccount.did))
      ) {
        return
      }

      let cancelled = false

      const migrate = async () => {
        while (!cancelled) {
          const threads = persisted.get('mutedThreads')

          const root = threads.findLast(uri => uri.includes(currentAccount.did))

          if (!root) break

          persisted.write(
            'mutedThreads',
            threads.filter(uri => uri !== root),
          )

          setThreadMute(root, true)

          await agent.api.app.bsky.graph
            .muteThread({root})
            // not a big deal if this fails, since the post might have been deleted
            .catch(console.error)
        }
      }

      migrate()

      return () => {
        cancelled = true
      }
    }
  }, [agent, currentAccount, setThreadMute])
}
