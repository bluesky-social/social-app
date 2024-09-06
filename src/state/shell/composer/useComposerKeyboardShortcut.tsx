import React from 'react'

import {useComposerControls, useComposerState} from './'

export function useComposerKeyboardShortcut() {
  const isOpen = !!useComposerState()
  const {openComposer} = useComposerControls()

  React.useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (isOpen) return
      if (event.key === 'n' || event.key === 'N') openComposer({})
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, openComposer])
}
