import {useCallback, useRef} from 'react'

export function createRunCallbackOnce() {
  let hasRun = false
  return function runCallbackOnce(callback: () => void) {
    if (!hasRun) {
      hasRun = true
      callback()
    }
  }
}

export function useRunCallbackOnce(callback: () => void) {
  const hasRunRef = useRef(false)
  return useCallback(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true
      callback()
    }
  }, [callback])
}
