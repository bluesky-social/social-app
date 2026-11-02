import {createContext, useContext, useState} from 'react'

/**
 * Lets a control nested in a row, e.g. a follow button, switch off the row's
 * hover highlight while the control itself is hovered, so that it reads as a
 * target of its own rather than as part of the row.
 */
export const SuppressHoverContext = createContext<
  (suppressed: boolean) => void
>(() => {})

export function useSuppressHover() {
  return useContext(SuppressHoverContext)
}

/**
 * Hover state for a row, which is `hover` unless a nested control has
 * suppressed it. Spread `hoverProps` onto the row, and provide `setSuppressed`
 * through `SuppressHoverContext`.
 *
 * The row stays hovered while the pointer is over a nested control, so a
 * control can't clear it by itself.
 */
export function useRowHover() {
  const [hovered, setHovered] = useState(false)
  const [suppressed, setSuppressed] = useState(false)

  return {
    hover: hovered && !suppressed,
    setSuppressed,
    hoverProps: {
      onPointerEnter: () => setHovered(true),
      // Also clears a control that unmounted while hovered, so it can't leave
      // the row stuck without a highlight
      onPointerLeave: () => {
        setHovered(false)
        setSuppressed(false)
      },
    },
  }
}
