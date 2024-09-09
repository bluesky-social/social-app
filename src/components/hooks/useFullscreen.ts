import {useCallback, useSyncExternalStore} from 'react'

import {isWeb} from '#/platform/detection'

function fullscreenSubscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

export function useFullscreen(ref: React.RefObject<HTMLElement>) {
  if (!isWeb) throw new Error("'useFullscreen' is a web-only hook")
  const isFullscreen = useSyncExternalStore(fullscreenSubscribe, () =>
    Boolean(document.fullscreenElement),
  )

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      if (!ref.current) return
      ref.current.requestFullscreen()
    }
  }, [isFullscreen, ref])

  return [isFullscreen, toggleFullscreen] as const
}
