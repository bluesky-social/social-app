import {createContext, useContext, useState} from 'react'

type StateContext = boolean
type ApiContext = (hasNew: boolean) => void

const stateContext = createContext<StateContext>(false)
stateContext.displayName = 'HomeBadgeStateContext'
const apiContext = createContext<ApiContext>((_: boolean) => {})
apiContext.displayName = 'HomeBadgeApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(false)
  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={setState}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHomeBadge() {
  return useContext(stateContext)
}

export function useSetHomeBadge() {
  return useContext(apiContext)
}
