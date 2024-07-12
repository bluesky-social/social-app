import React from 'react'

const CurrentConvoIdContext = React.createContext<{
  currentConvoId: string | undefined
  setCurrentConvoId: (convoId: string | undefined) => void
}>({
  currentConvoId: undefined,
  setCurrentConvoId: () => {},
})

export function useCurrentConvoId() {
  const ctx = React.useContext(CurrentConvoIdContext)
  if (!ctx) {
    throw new Error(
      'useCurrentConvoId must be used within a CurrentConvoIdProvider',
    )
  }
  return ctx
}

export function CurrentConvoIdProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentConvoId, setCurrentConvoId] = React.useState<
    string | undefined
  >()
  const ctx = React.useMemo(
    () => ({currentConvoId, setCurrentConvoId}),
    [currentConvoId],
  )
  return (
    <CurrentConvoIdContext.Provider value={ctx}>
      {children}
    </CurrentConvoIdContext.Provider>
  )
}
