import {createContext, useCallback, useContext, useState} from 'react'

type DateDividerToggleContextType = {
  isDividerToggled: (id: string) => boolean
  toggleDivider: (id: string) => void
}

const DateDividerToggleContext = createContext<DateDividerToggleContextType>({
  isDividerToggled: () => false,
  toggleDivider: () => {},
})

export function DateDividerToggleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toggledIds, setToggledIds] = useState(new Set<string>())

  const toggleDivider = useCallback((id: string) => {
    setToggledIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isDividerToggled = useCallback(
    (id: string) => toggledIds.has(id),
    [toggledIds],
  )

  return (
    <DateDividerToggleContext.Provider
      value={{isDividerToggled, toggleDivider}}>
      {children}
    </DateDividerToggleContext.Provider>
  )
}

export function useDateDividerToggle() {
  return useContext(DateDividerToggleContext)
}
