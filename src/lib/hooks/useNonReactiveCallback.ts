import {useCallback, useInsertionEffect, useRef} from 'react'

const noop = () => {}

/**
 * This should be used sparingly. It erases reactivity, i.e. when the inputs
 * change, the function itself will remain the same. This means that if you use
 * this at a higher level of your tree, and then some state you read in it
 * changes, there is no mechanism for anything below in the tree to "react" to
 * this change (e.g. by knowing to call your function again).
 *
 * Also, you should avoid calling the returned function during rendering since
 * the values captured by it are going to lag behind.
 *
 * For objects, see `useNonReactiveObject` instead.
 *
 * Use this rather than `useEffectEvent` in a component wrapped in `memo()` or
 * `forwardRef()`, and in any hook that such a component calls. React 19.2
 * never updates a `useEffectEvent` there after the first render, so it keeps
 * calling the first render's closure, with stale props and state, and nothing
 * warns (react/react#35187, fixed in React 19.3).
 */
export function useNonReactiveCallback<T extends Function = () => void>(
  fn?: T,
): T {
  const ref = useRef<T>((fn ?? noop) as T)
  useInsertionEffect(() => {
    ref.current = (fn ?? noop) as T
  }, [fn])
  return useCallback(
    (...args: any) => {
      const latestFn = ref.current
      return latestFn(...args)
    },
    [ref],
  ) as unknown as T
}
