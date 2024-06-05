import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'

type StateContext = number

const stateContext = createContext<StateContext>(0)

export function Provider({children}: PropsWithChildren<{}>) {
  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => {
      setTick(Date.now())
    }, 60_000)
    return () => clearInterval(i)
  }, [])
  return <stateContext.Provider value={tick}>{children}</stateContext.Provider>
}

export function useTickEveryMinute() {
  return useContext(stateContext)
}
