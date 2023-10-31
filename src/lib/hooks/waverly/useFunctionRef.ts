import {useCallback, useEffect, useRef} from 'react'

/**
 * This wraps the passed function into a ref and updates the ref whenever the
 * callback is updated. This is useful to call function within a PanResponder
 * or similar construct that rely on useRef.
 *
 * Usage:
 * - useFunctionRef(func) => [ callbackRef, isUndefined ]
 * -   callbackRef: A function with the same signature as `func` but that can
 * return undefined if the passed `func` is undefined
 * -   isUndefined: A function that returns true if `func` is undefined
 */
export const useFunctionRef = <T extends (...args: any[]) => any>(
  func?: T,
): [(...args: Parameters<T>) => ReturnType<T> | undefined, () => boolean] => {
  const funcRef = useRef(func)

  useEffect(() => {
    funcRef.current = func
  }, [func])

  const indirectFunc = useCallback((...args: Parameters<T>) => {
    if (!funcRef.current) return undefined
    return funcRef.current(...args)
  }, [])

  const isUndefined = useCallback(() => funcRef.current === undefined, [])

  return [indirectFunc, isUndefined]
}
