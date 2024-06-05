import {useCallback, useEffect, useRef} from 'react'

/**
 * Helper hook to run persistent timers on views
 */
export function useTimer(time: number, handler: () => void) {
  const timer = useRef<undefined | NodeJS.Timeout>(undefined)

  // function to restart the timer
  const reset = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(handler, time)
  }, [time, timer, handler])

  // function to cancel the timer
  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = undefined
    }
  }, [timer])

  // start the timer immediately
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [reset, cancel]
}
