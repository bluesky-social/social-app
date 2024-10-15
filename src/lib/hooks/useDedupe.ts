import React from 'react'

export const useDedupe = (timeout = 250) => {
  const canDo = React.useRef(true)

  return React.useCallback(
    (cb: () => unknown) => {
      if (canDo.current) {
        canDo.current = false
        setTimeout(() => {
          canDo.current = true
        }, timeout)
        cb()
        return true
      }
      return false
    },
    [timeout],
  )
}
