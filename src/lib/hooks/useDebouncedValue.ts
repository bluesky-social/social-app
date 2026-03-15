import {useEffect, useState} from 'react'

/**
 * Returns a debounced version of the input value that only updates after the
 * specified delay has passed without any changes to the input value.
 */
export function useDebouncedValue<T>(val: T, delayMs: number): T {
  const [prev, setPrev] = useState(val)

  useEffect(() => {
    const timeout = setTimeout(() => setPrev(val), delayMs)
    return () => clearTimeout(timeout)
  }, [val, delayMs])

  return prev
}
