import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import {isFirefox, isSafari} from '#/lib/browser'
import {isWeb} from '#/platform/detection'

function fullscreenSubscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

export function useFullscreen(ref?: React.RefObject<HTMLElement>) {
  if (!isWeb) throw new Error("'useFullscreen' is a web-only hook")
  const isFullscreen = useSyncExternalStore(fullscreenSubscribe, () =>
    Boolean(document.fullscreenElement),
  )
  const scrollYRef = useRef<null | number>(null)
  const [prevIsFullscreen, setPrevIsFullscreen] = useState(isFullscreen)

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      if (!ref) throw new Error('No ref provided')
      if (!ref.current) return
      scrollYRef.current = window.scrollY
      ref.current.requestFullscreen()
    }
  }, [isFullscreen, ref])

  useEffect(() => {
    if (prevIsFullscreen === isFullscreen) return
    setPrevIsFullscreen(isFullscreen)

    // Chrome has an issue where it doesn't scroll back to the top after exiting fullscreen
    // Let's play it safe and do it if not FF or Safari, since anything else will probably be chromium
    if (prevIsFullscreen && !isFirefox && !isSafari) {
      setTimeout(() => {
        if (scrollYRef.current !== null) {
          window.scrollTo(0, scrollYRef.current)
          scrollYRef.current = null
        }
      }, 100)
    }
  }, [isFullscreen, prevIsFullscreen])

  return [isFullscreen, toggleFullscreen] as const
}
