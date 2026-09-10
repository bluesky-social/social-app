import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {
  type DerivedValue,
  type SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'

export type ScreenPresence = {
  /**
   * How visible this screen is on screen, 0..1, tracking the native stack
   * transition frame by frame (including interactive swipe-back). Always 1 on
   * web and for screens that are not inside a native stack.
   */
  visibility: SharedValue<number>
  /**
   * `visibility`, but also 0 when the screen's tab (or any other ancestor
   * navigator) is not focused. This is the value shell UI should follow: it is
   * 1 exactly when the screen is what the user is looking at.
   */
  presence: SharedValue<number>
}

export const ScreenPresenceContext = createContext<ScreenPresence | null>(null)
ScreenPresenceContext.displayName = 'ScreenPresenceContext'

/**
 * Reads the presence of the nearest `Layout.Screen`. Outside of one, both
 * values are a constant 1.
 */
export function useScreenPresence(): ScreenPresence {
  const context = useContext(ScreenPresenceContext)
  const fallback = useSharedValue(1)
  return context ?? {visibility: fallback, presence: fallback}
}

type CoverageEntry = {
  id: number
  presence: SharedValue<number>
}

const ScreenCoverageContext = createContext<DerivedValue<number> | null>(null)
ScreenCoverageContext.displayName = 'ScreenCoverageContext'
const ScreenCoverageRegisterContext = createContext<
  ((presence: SharedValue<number>) => () => void) | null
>(null)
ScreenCoverageRegisterContext.displayName = 'ScreenCoverageRegisterContext'

let nextCoverageId = 0

/**
 * Sums the presence of every mounted screen that reports one. Exactly one
 * screen is fully present at rest, so this is 1 whenever every screen taking
 * part in a transition is still mounted, and falls short by exactly the share
 * of a screen that has already been unmounted (a JS-initiated pop swaps the
 * outgoing screen for a snapshot, which stops reporting progress). Shell UI
 * that belonged to such a screen can fill that gap to stay in sync with the
 * incoming screen's transition.
 */
export function ScreenCoverageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [entries, setEntries] = useState<CoverageEntry[]>([])

  const coverage = useDerivedValue(() => {
    let sum = 0
    for (const entry of entries) {
      sum += entry.presence.get()
    }
    return sum
  }, [entries])

  const register = useMemo(
    () => (presence: SharedValue<number>) => {
      const id = nextCoverageId++
      setEntries(prev => [...prev, {id, presence}])
      return () => setEntries(prev => prev.filter(entry => entry.id !== id))
    },
    [],
  )

  return (
    <ScreenCoverageRegisterContext.Provider value={register}>
      <ScreenCoverageContext.Provider value={coverage}>
        {children}
      </ScreenCoverageContext.Provider>
    </ScreenCoverageRegisterContext.Provider>
  )
}

/**
 * Counts a screen's presence towards `useScreenCoverage()` while mounted.
 */
export function useRegisterScreenCoverage(presence: SharedValue<number>) {
  const register = useContext(ScreenCoverageRegisterContext)
  useEffect(() => register?.(presence), [register, presence])
}

/**
 * Total presence of all mounted screens, see `ScreenCoverageProvider`. A
 * constant 1 outside the provider.
 */
export function useScreenCoverage(): SharedValue<number> {
  const coverage = useContext(ScreenCoverageContext)
  const fallback = useSharedValue(1)
  return coverage ?? fallback
}
