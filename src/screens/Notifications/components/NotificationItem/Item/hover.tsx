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
 * Whether a nested control has suppressed a row's hover highlight. The
 * highlight itself is CSS (see `SubtleHover`), so pass this as its `disabled`.
 * Spread `hoverProps` onto the row, and provide `setSuppressed` through
 * `SuppressHoverContext`.
 */
export function useRowHover() {
  const [suppressed, setSuppressed] = useState(false)

  return {
    suppressed,
    setSuppressed,
    hoverProps: {
      // Clears a control that unmounted while hovered, so it can't leave the
      // row stuck without a highlight
      onPointerLeave: () => setSuppressed(false),
    },
  }
}
