import React from 'react'

import {useComposerControls} from './'

/**
 * Based on {@link https://github.com/jaywcjlove/hotkeys-js/blob/b0038773f3b902574f22af747f3bb003a850f1da/src/index.js#L51C1-L64C2}
 */
function shouldIgnore(event: KeyboardEvent) {
  const target: any = event.target || event.srcElement
  if (!target) return false
  const {tagName} = target
  if (!tagName) return false
  const isInput =
    tagName === 'INPUT' &&
    ![
      'checkbox',
      'radio',
      'range',
      'button',
      'file',
      'reset',
      'submit',
      'color',
    ].includes(target.type)
  // ignore: isContentEditable === 'true', <input> and <textarea> when readOnly state is false, <select>
  if (
    target.isContentEditable ||
    ((isInput || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
      !target.readOnly)
  ) {
    return true
  }
  return false
}

export function useComposerKeyboardShortcut() {
  const {openComposer} = useComposerControls()

  React.useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (shouldIgnore(event)) return
      if (event.key === 'n' || event.key === 'N') {
        openComposer({})
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openComposer])
}
