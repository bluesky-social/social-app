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
