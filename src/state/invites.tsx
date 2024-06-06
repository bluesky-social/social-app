import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['invites']
type ApiContext = {
  setInviteCopied: (code: string) => void
}

const stateContext = createContext<StateContext>(persisted.defaults.invites)
const apiContext = createContext<ApiContext>({
  setInviteCopied(_: string) {},
})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('invites'))

  const api = useMemo(
    () => ({
      setInviteCopied(code: string) {
        setState(state => {
          state = {
            ...state,
            copiedInvites: state.copiedInvites.includes(code)
              ? state.copiedInvites
              : state.copiedInvites.concat([code]),
          }
          persisted.write('invites', state)
          return state
        })
      },
    }),
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('invites'))
    })
  }, [setState])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useInvitesState() {
  return useContext(stateContext)
}

export function useInvitesAPI() {
  return useContext(apiContext)
}
