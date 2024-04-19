import {useEffect, useState} from 'react'

export function useDebouncedValue<T>(value: T, time?: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value)
    }, time)

    return () => clearTimeout(timeout)
  }, [value, time])

  return debouncedValue
}
