import {useCallback, useState} from 'react'
import {
  clamp,
  type SharedValue,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {SHELL_SPRING_CONFIG} from '#/lib/custom-animations/springs'

type Contribution = {
  id: number
  value: SharedValue<number>
}

let nextId = 0

/**
 * Sums any number of 0..1 shared values (plus an optional base value) into a
 * single derived value clamped to 0..1, entirely on the UI thread.
 *
 * This replaces boolean refcounting for shell state: each contributor owns a
 * shared value it can drive however it likes (a spring, a scroll gesture, a
 * screen transition), and the sum is what the shell renders. Contributions
 * are summed rather than maxed so that two overlapping contributors (e.g. one
 * screen transitioning out while another transitions in) hold the total at 1
 * instead of dipping in the middle.
 */
export function useContributionRegistry(base?: SharedValue<number>) {
  const [contributions, setContributions] = useState<Contribution[]>([])

  const total = useDerivedValue(() => {
    let sum = base ? base.get() : 0
    for (const contribution of contributions) {
      sum += contribution.value.get()
    }
    return clamp(sum, 0, 1)
  }, [contributions, base])

  const remove = useCallback((id: number) => {
    setContributions(prev => prev.filter(c => c.id !== id))
  }, [])

  /**
   * Adds a contribution and returns a function to remove it. Removal animates
   * the value to 0 first so that a contributor unmounting while still active
   * (e.g. a screen removed without a transition) does not snap the total.
   */
  const register = useCallback(
    (value: SharedValue<number>) => {
      const id = nextId++
      setContributions(prev => [...prev, {id, value}])
      return () => {
        value.set(
          withSpring(0, SHELL_SPRING_CONFIG, finished => {
            if (finished) {
              scheduleOnRN(remove, id)
            }
          }),
        )
      }
    },
    [remove],
  )

  return {total, register}
}
