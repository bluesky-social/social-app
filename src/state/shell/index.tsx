import React from 'react'

type Context = {
  minimalShellMode: boolean
  setMinimalShellMode: (minimalShellMode: boolean) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (_isOpen: boolean) => void
  isDrawerSwipeDisabled: boolean
  setIsDrawerSwipeDisabled: (_isDisabled: boolean) => void
}

const defaultContextValue = {
  minimalShellMode: false,
  setMinimalShellMode: (_minimalShellMode: boolean) => {},
  isDrawerOpen: false,
  setIsDrawerOpen: (_isOpen: boolean) => {},
  isDrawerSwipeDisabled: false,
  setIsDrawerSwipeDisabled: (_isDisabled: boolean) => {},
}

const context = React.createContext<Context>(defaultContextValue)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [minimalShellMode, _setMinimalShellMode] = React.useState(
    defaultContextValue.minimalShellMode,
  )
  const [isDrawerOpen, _setIsDrawerOpen] = React.useState(
    defaultContextValue.isDrawerOpen,
  )
  const [isDrawerSwipeDisabled, _setIsDrawerSwipeDisabled] = React.useState(
    defaultContextValue.isDrawerSwipeDisabled,
  )
  const value = {
    minimalShellMode,
    setMinimalShellMode: _setMinimalShellMode,
    isDrawerOpen,
    setIsDrawerOpen: _setIsDrawerOpen,
    isDrawerSwipeDisabled,
    setIsDrawerSwipeDisabled: _setIsDrawerSwipeDisabled,
  }

  return <context.Provider value={value}>{children}</context.Provider>
}

export function useShellState() {
  return React.useContext(context)
}
