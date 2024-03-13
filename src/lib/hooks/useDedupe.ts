import React from 'react'

export const useDedupe = () => {
  const canDo = React.useRef(true)

  return React.useRef((cb: () => unknown) => {
    if (canDo.current) {
      canDo.current = false
      setTimeout(() => {
        canDo.current = true
      }, 250)
      cb()
      return true
    }
    return false
  }).current
}
