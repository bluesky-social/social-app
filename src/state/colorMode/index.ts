import React from 'react'

import {isWeb} from '#/platform/detection'
import {
  Schema,
  PersistedContext,
  PersistedSetStateContext,
} from '#/state/persisted'

export function useColorMode() {
  const {colorMode} = React.useContext(PersistedContext)
  const {setState} = React.useContext(PersistedSetStateContext)

  const setColorMode = React.useCallback(
    (colorMode: Schema['colorMode']) => {
      setState(s => ({
        ...s,
        colorMode,
      }))

      if (isWeb && typeof window !== 'undefined') {
        const html = window.document.documentElement
        // remove any other color mode classes
        html.className = html.className.replace(/colorMode--\w+/g, '')
        html.classList.add(`colorMode--${colorMode}`)
      }
    },
    [setState],
  )

  return {colorMode, setColorMode}
}
