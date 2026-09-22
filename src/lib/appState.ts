import {useEffect, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

export function getCurrentState(): AppStateStatus | undefined {
  const state = AppState.currentState
  switch (state) {
    case 'active':
    case 'background':
    case 'extension':
    case 'inactive':
    case 'unknown':
      return state
    default:
      return undefined
  }
}

export function onAppStateChange(cb: (state: AppStateStatus) => void) {
  let prev = AppState.currentState
  return AppState.addEventListener('change', next => {
    if (next === prev) return
    prev = next
    cb(next)
  })
}

export function useOnAppStateChange(cb: (state: AppStateStatus) => void) {
  useEffect(() => {
    const sub = onAppStateChange(next => cb(next))
    return () => sub.remove()
  }, [cb])
}

export function useAppState() {
  const [state, setState] = useState(AppState.currentState)
  useOnAppStateChange(setState)
  return state
}
