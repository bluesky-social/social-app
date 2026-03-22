import {useEffect, useState} from 'react'

export function useDelayedLoading(delay: number, isActuallyLoading: boolean) {
  const [isDelayActive, setIsDelayActive] = useState(isActuallyLoading)

  useEffect(() => {
    if (!isDelayActive) return

    const timeout = setTimeout(() => setIsDelayActive(false), delay)
    return () => clearTimeout(timeout)
  }, [isDelayActive, delay])

  return isDelayActive || isActuallyLoading
}
