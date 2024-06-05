import {useRef} from 'react'

export const useDedupe = () => {
  const canDo = useRef(true)

  return useRef((cb: () => unknown) => {
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
