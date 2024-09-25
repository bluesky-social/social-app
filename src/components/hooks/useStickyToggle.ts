import {useEffect, useState} from 'react'

// stayed true for at least `delay` ms before returning to false
export function useStickyToggle(value: boolean, delay: number) {
  const [prevValue, setPrevValue] = useState(value)
  const [isSticking, setIsSticking] = useState(false)

  useEffect(() => {
    if (isSticking) {
      const timeout = setTimeout(() => setIsSticking(false), delay)
      return () => clearTimeout(timeout)
    }
  }, [isSticking, delay])

  if (value !== prevValue) {
    setIsSticking(prevValue) // Going true -> false should stick.
    setPrevValue(value)
    return prevValue ? true : value
  }

  return isSticking ? true : value
}
