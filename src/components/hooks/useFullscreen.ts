import {useCallback, useEffect, useRef, useSyncExternalStore} from 'react'

import {IS_WEB, IS_WEB_FIREFOX, IS_WEB_SAFARI} from '#/env'

function fullscreenSubscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

function getFullscreenSnapshot() {
  return Boolean(document.fullscreenElement)
}

export function useFullscreen(ref?: React.RefObject<HTMLElement | null>) {
  if (!IS_WEB) throw new Error("'useFullscreen' is a web-only hook")
  const isFullscreen = useSyncExternalStore(
    fullscreenSubscribe,
    getFullscreenSnapshot,
  )
  const scrollYRef = useRef<null | number>(null)
  // Tracked via a ref rather than state so that reacting to a fullscreen change
  // never schedules its own render. Scheduling a render in response to the
  // external store value (the old `setPrevIsFullscreen` pattern) was a seed for
  // the commit-phase update loop reported in APP-315 / APP-5PP / APP-7ZB.
  const prevIsFullscreenRef = useRef(isFullscreen)

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      void document.exitFullscreen()
    } else {
      if (!ref) throw new Error('No ref provided')
      if (!ref.current) return
      scrollYRef.current = window.scrollY
      void ref.current.requestFullscreen()
    }
  }, [isFullscreen, ref])

  useEffect(() => {
    const prevIsFullscreen = prevIsFullscreenRef.current
    if (prevIsFullscreen === isFullscreen) return
    prevIsFullscreenRef.current = isFullscreen

    // Chrome has an issue where it doesn't scroll back to the top after exiting fullscreen
    // Let's play it safe and do it if not FF or Safari, since anything else will probably be chromium
    if (prevIsFullscreen && !IS_WEB_FIREFOX && !IS_WEB_SAFARI) {
      setTimeout(() => {
        if (scrollYRef.current !== null) {
          window.scrollTo(0, scrollYRef.current)
          scrollYRef.current = null
        }
      }, 100)
    }
  }, [isFullscreen])

  return [isFullscreen, toggleFullscreen] as const
}
