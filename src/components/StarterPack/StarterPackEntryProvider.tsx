import React from 'react'

interface IStarterPackEntryContext {
  isReady?: boolean
  starterPackId?: string
}

const StarterPackEntryContext = React.createContext<IStarterPackEntryContext>({
  isReady: false,
})
export const useStarterPackEntry = () =>
  React.useContext(StarterPackEntryContext)

export function StarterPackEntryProvider() {
  const [state] = React.useState<IStarterPackEntryContext>({
    isReady: false,
  })

  React.useEffect(() => {}, [])

  return (
    <StarterPackEntryContext.Provider value={state}>
      {children}
    </StarterPackEntryContext.Provider>
  )
}
