import {useInsertionEffect, useRef} from 'react'

/**
 * This should be used sparingly. It erases reactivity, i.e. when the inputs
 * change, the returned object itself will remain the same. This means that if
 * you use this at a higher level of your tree, and then some state you read in
 * it changes, there is no mechanism for anything below in the tree to "react"
 * to this change (e.g. by knowing to call your function again).
 *
 * For callbacks, see `useNonReactiveCallback` instead.
 */
export function useNonReactiveObject<T extends Record<string, unknown>>(
  o: T,
): React.RefObject<T> {
  const ref = useRef(o)
  useInsertionEffect(() => {
    ref.current = o
  }, [o])
  return ref
}
