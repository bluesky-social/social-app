import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

/*
 * Several preferences were each their own Provider, and each of those rendered a
 * state context plus a setter context - three fibers apiece, all of them sitting
 * between the app root and every screen.
 *
 * That depth is not free. React walks the full return path to the root on every
 * bailout, and a scrolling list bails out on most of its cells on every update,
 * so the provider stack is multiplied by (renders per second x mounted cells).
 * Collapsing these into one state context and one setter context trades a wider
 * re-render on preference change - which only happens from a settings screen -
 * for a permanently shallower tree.
 */
const KEYS = [
  'requireAltTextEnabled',
  'disableAutoplay',
  'disableHaptics',
  'useInAppBrowser',
  'largeAltBadgeEnabled',
  'subtitlesEnabled',
  'hasCheckedForStarterPack',
] as const

type Key = (typeof KEYS)[number]
type Values = {[K in Key]: persisted.Schema[K]}
type SetFn = <K extends Key>(key: K, value: Values[K]) => void

function readAll(): Values {
  const out = {} as Values
  for (const key of KEYS) {
    // @ts-expect-error indexed write across the key union
    out[key] = persisted.get(key)
  }
  return out
}

const stateContext = createContext<Values>(
  Object.fromEntries(KEYS.map(k => [k, persisted.defaults[k]])) as Values,
)
stateContext.displayName = 'SimplePrefsStateContext'
const setContext = createContext<SetFn>(() => {})
setContext.displayName = 'SimplePrefsSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(readAll)

  useEffect(() => {
    const unsubs = KEYS.map(key =>
      persisted.onUpdate(key, next => {
        setState(prev => ({...prev, [key]: next}))
      }),
    )
    return () => unsubs.forEach(unsub => unsub())
  }, [])

  const set = useCallback<SetFn>((key, value) => {
    setState(prev => ({...prev, [key]: value}))
    // @ts-expect-error indexed write across the key union
    void persisted.write(key, value)
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={set}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function usePref<K extends Key>(key: K): Values[K] {
  return useContext(stateContext)[key]
}

export function useSetPref<K extends Key>(key: K): (value: Values[K]) => void {
  const set = useContext(setContext)
  return useCallback((value: Values[K]) => set(key, value), [set, key])
}
