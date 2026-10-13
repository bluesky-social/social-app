import {createContext, use, useEffect, useState} from 'react'

type StateContext = number

const stateContext = createContext<StateContext>(0)
stateContext.displayName = 'TickEveryMinuteContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => {
      setTick(Date.now())
    }, 60_000)
    return () => clearInterval(i)
  }, [])
  return <stateContext.Provider value={tick}>{children}</stateContext.Provider>
}

/**
 * Returns a timestamp that updates once per minute, re-rendering the caller
 * on every tick. Pass `enabled: false` to skip subscribing entirely - the
 * caller then never re-renders on tick and receives a stable `0`. Relies on
 * React 19 `use()`, which may be called conditionally.
 */
export function useTickEveryMinute(enabled: boolean = true) {
  if (enabled) {
    return use(stateContext)
  }
  return 0
}
