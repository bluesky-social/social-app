import React from 'react'

export function useOutsideClick(
  containerRef: React.RefObject<HTMLElement>,
  callback: () => void,
  enabled = true,
) {
  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef.current!

    // We'd like to know where the click initially started from, not where the
    // click ended up, this prevents closing the modal prematurely from the user
    // accidentally overshooting their mouse cursor.
    let initialTarget: HTMLElement | null

    const handlePointerDown = (ev: MouseEvent) => {
      initialTarget = ev.target as HTMLElement | null
    }

    const handleClick = () => {
      if (!initialTarget) {
        return
      }

      const target = initialTarget
      initialTarget = null

      if (container.contains(target)) {
        return
      }

      callback()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('click', handleClick)
    }
  }, [containerRef, callback, enabled])
}
