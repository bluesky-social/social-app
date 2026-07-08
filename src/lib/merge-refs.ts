import {type Ref, type RefCallback} from 'react'

/**
 * Assigns a value to a ref.
 * @param ref The ref to assign the value to.
 * @param value The value to assign to the ref.
 * @returns The ref cleanup callback, if any.
 */
function assignRef<T>(
  ref: Ref<T> | undefined | null,
  value: T | null,
): ReturnType<RefCallback<T>> {
  if (typeof ref === 'function') {
    return ref(value)
  } else if (ref) {
    ref.current = value
  }
}

/**
 * This TypeScript function merges multiple React refs into a single ref callback.
 * When developing low level UI components, it is common to have to use a local ref
 * but also support an external one using React.forwardRef.
 * Natively, React does not offer a way to set two refs inside the ref property. This is the goal of this small utility.
 * Today a ref can be a function or an object, tomorrow it could be another thing, who knows.
 * This utility handles compatibility for you.
 * This function is inspired by https://github.com/gregberge/react-merge-refs
 * @param refs - An array of React refs, which can be either `React.MutableRefObject<T>` or
 * `React.LegacyRef<T>`. These refs are used to store references to DOM elements or React components.
 * The `mergeRefs` function takes in an array of these refs and returns a callback function that
 * @returns The function `mergeRefs` is being returned. It takes an array of mutable or legacy refs and
 * returns a ref callback function that can be used to merge multiple refs into a single ref.
 */
export function mergeRefs<T>(refs: (Ref<T> | undefined)[]): Ref<T> {
  return (value: T | null) => {
    const cleanups: (() => void)[] = []

    for (const ref of refs) {
      const cleanup = assignRef(ref, value)
      const isCleanup = typeof cleanup === 'function'
      cleanups.push(isCleanup ? cleanup : () => assignRef(ref, null))
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }
}
