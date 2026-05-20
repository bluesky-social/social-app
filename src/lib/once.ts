import {useCallback, useRef} from 'react'

type Cb = () => void

export function callOnce() {
  let ran = false
  return function runCallbackOnce(cb: Cb) {
    if (ran) return
    ran = true
    cb()
  }
}

export function useCallOnce(cb: Cb): () => void
export function useCallOnce(cb?: undefined): (cb: Cb) => void
export function useCallOnce(cb?: Cb) {
  const ran = useRef(false)
  return useCallback(
    (icb: Cb) => {
      if (ran.current) return
      ran.current = true
      if (icb) icb()
      else if (cb) cb()
    },
    [cb],
  )
}
