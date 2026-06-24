import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

export type ImpressionVisibility = 'show' | 'hideOwn' | 'hideOthers' | 'hideAll'
export type ImpressionVisibilityKey =
  | 'likes'
  | 'reposts'
  | 'replies'
  | 'quotes'
  | 'bookmarks'
export type ImpressionVisibilityPrefs = Partial<
  Record<ImpressionVisibilityKey, ImpressionVisibility>
>

type StateContext = ImpressionVisibilityPrefs
type SetContext = (
  impression: ImpressionVisibilityKey,
  value: ImpressionVisibility,
) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.impressionVisibility ?? {},
)
stateContext.displayName = 'ImpressionVisibilityStateContext'

const setContext = createContext<SetContext>((_impression, _value) => {})
setContext.displayName = 'ImpressionVisibilitySetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState<ImpressionVisibilityPrefs>(
    () => persisted.get('impressionVisibility') ?? {},
  )

  const setStateWrapped = useCallback(
    (impression: ImpressionVisibilityKey, value: ImpressionVisibility) => {
      setState(prev => {
        const next = {...prev, [impression]: value}
        persisted.write('impressionVisibility', next)
        return next
      })
    },
    [],
  )

  useEffect(() => {
    return persisted.onUpdate('impressionVisibility', next => {
      setState(next ?? {})
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useImpressionVisibilityPrefs() {
  return useContext(stateContext)
}

export function useSetImpressionVisibility() {
  return useContext(setContext)
}

export function useIsImpressionHidden(
  impression: ImpressionVisibilityKey,
  isMe: boolean,
): boolean {
  const prefs = useImpressionVisibilityPrefs()
  const v = prefs[impression] ?? 'show'
  if (v === 'hideAll') return true
  if (v === 'hideOwn' && isMe) return true
  if (v === 'hideOthers' && !isMe) return true
  return false
}
