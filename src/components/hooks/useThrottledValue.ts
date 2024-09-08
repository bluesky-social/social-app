import {useEffect, useRef, useState} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

export function useThrottledValue<T>(value: T, time: number) {
  const pendingValueRef = useRef(value)
  const [throttledValue, setThrottledValue] = useState(value)

  useEffect(() => {
    pendingValueRef.current = value
  }, [value])

  const handleTick = useNonReactiveCallback(() => {
    if (pendingValueRef.current !== throttledValue) {
      setThrottledValue(pendingValueRef.current)
    }
  })

  useEffect(() => {
    const id = setInterval(handleTick, time)
    return () => {
      clearInterval(id)
    }
  }, [handleTick, time])

  return throttledValue
}
