import React from 'react'

export const useDedupe = (timeout = 250) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const canDo = React.useRef(true)

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (cb: () => unknown) => {
    if (canDo.current) {
      canDo.current = false
      timeoutRef.current = setTimeout(() => {
        canDo.current = true
      }, timeout)
      cb()
      return true
    }
    return false
  }
}
