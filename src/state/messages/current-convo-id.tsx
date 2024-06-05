import {createContext, ReactNode, useContext, useMemo, useState} from 'react'

const CurrentConvoIdContext = createContext<{
  currentConvoId: string | undefined
  setCurrentConvoId: (convoId: string | undefined) => void
}>({
  currentConvoId: undefined,
  setCurrentConvoId: () => {},
})

export function useCurrentConvoId() {
  const ctx = useContext(CurrentConvoIdContext)
  if (!ctx) {
    throw new Error(
      'useCurrentConvoId must be used within a CurrentConvoIdProvider',
    )
  }
  return ctx
}

export function CurrentConvoIdProvider({children}: {children: ReactNode}) {
  const [currentConvoId, setCurrentConvoId] = useState<string | undefined>()
  const ctx = useMemo(
    () => ({currentConvoId, setCurrentConvoId}),
    [currentConvoId],
  )
  return (
    <CurrentConvoIdContext.Provider value={ctx}>
      {children}
    </CurrentConvoIdContext.Provider>
  )
}
