import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['blackskyVerification']
type SetContext = (v: persisted.Schema['blackskyVerification']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.blackskyVerification,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['blackskyVerification']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('blackskyVerification'),
  )

  const setStateWrapped = React.useCallback(
    (blackskyVerification: persisted.Schema['blackskyVerification']) => {
      setState(blackskyVerification)
      persisted.write('blackskyVerification', blackskyVerification)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'blackskyVerification',
      nextBlackskyVerification => {
        setState(nextBlackskyVerification)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useBlackskyVerification() {
  return (
    React.useContext(stateContext) ?? persisted.defaults.blackskyVerification!
  )
}

export function useBlackskyVerificationEnabled() {
  return useBlackskyVerification().enabled
}

export function useBlackskyVerificationTrusted(
  mandatory: string | undefined = undefined,
) {
  const trusted = new Set(useBlackskyVerification().trusted)
  if (mandatory) {
    trusted.add(mandatory)
  }
  return trusted
}

export function useSetBlackskyVerification() {
  return React.useContext(setContext)
}

export function useSetBlackskyVerificationEnabled() {
  const blackskyVerification = useBlackskyVerification()
  const setBlackskyVerification = useSetBlackskyVerification()

  return React.useMemo(
    () => (enabled: boolean) =>
      setBlackskyVerification({...blackskyVerification, enabled}),
    [blackskyVerification, setBlackskyVerification],
  )
}

export function useSetBlackskyVerificationTrust() {
  const blackskyVerification = useBlackskyVerification()
  const setBlackskyVerification = useSetBlackskyVerification()

  return React.useMemo(
    () => ({
      add: (add: string) => {
        const trusted = new Set(blackskyVerification.trusted)
        trusted.add(add)
        setBlackskyVerification({
          ...blackskyVerification,
          trusted: Array.from(trusted),
        })
      },
      remove: (remove: string) => {
        const trusted = new Set(blackskyVerification.trusted)
        trusted.delete(remove)
        setBlackskyVerification({
          ...blackskyVerification,
          trusted: Array.from(trusted),
        })
      },
    }),
    [blackskyVerification, setBlackskyVerification],
  )
}
