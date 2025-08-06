import React from 'react'

// Stubs for navigation functions and components for web
export function navigate() {
  // no-op for web
  return Promise.resolve()
}

export function reset() {
  // no-op for web
  return Promise.resolve()
}

export function resetToTab() {
  // no-op for web
}

export function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  // Just render children, no navigation context needed for web
  return <>{children}</>
}

export function TabsNavigator({children}: React.PropsWithChildren<{}>) {
  // Just render children, no tabs for web
  return <>{children}</>
}

export function FlatNavigator({children}: React.PropsWithChildren<{}>) {
  // Just render children, no stack for web
  return <>{children}</>
}

// Add a web-safe useNavigation hook for compatibility with code expecting a hook
export function useNavigation() {
  // Return a stable object with no-op methods and addListener for compatibility
  const addListener = React.useCallback(() => () => {}, [])
  return React.useMemo(
    () => ({
      navigate: () => {},
      goBack: () => {},
      addListener,
      // Add any other methods your code expects
    }),
    [addListener],
  )
}
