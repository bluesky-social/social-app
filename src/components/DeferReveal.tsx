import {ReactNode, useEffect, useState} from 'react'

export function DeferReveal({
  children,
  defer,
  // To verify, toggle `forceReveal` between `true` and `false`.
  iVerifiedThereAreNoLayoutJumps: _unused,
  forceReveal,
}: {
  children: ReactNode
  defer: boolean
  iVerifiedThereAreNoLayoutJumps: true
  forceReveal?: never // DEV-only
}) {
  const [isReady, setIsReady] = useState(!defer)
  useEffect(() => {
    if (!isReady) {
      setIsReady(true)
    }
  }, [isReady])
  const finalIsReady = forceReveal ?? isReady
  return finalIsReady ? children : null
}
