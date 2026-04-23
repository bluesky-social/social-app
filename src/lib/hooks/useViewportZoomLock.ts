import {useEffect} from 'react'

import {IS_WEB_MOBILE_IOS} from '#/env'

const ZOOM_LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover'

/**
 * iOS Safari zooms in when a text input with `font-size < 16px` gains focus.
 * To avoid that while still allowing users to pinch-zoom for accessibility, we
 * only pin `maximum-scale=1` while a text input is focused and restore the
 * original viewport on blur.
 */
export function useViewportZoomLock() {
  useEffect(() => {
    if (!IS_WEB_MOBILE_IOS) return

    const meta = document.querySelector('meta[name="viewport"]')
    if (!(meta instanceof HTMLMetaElement)) return

    const originalContent = meta.content

    const onFocusIn = (e: FocusEvent) => {
      if (isTextInput(e.target)) {
        meta.content = ZOOM_LOCKED_VIEWPORT
      }
    }

    const onFocusOut = (e: FocusEvent) => {
      if (isTextInput(e.target)) {
        meta.content = originalContent
      }
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      meta.content = originalContent
    }
  }, [])
}

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(target.type)
  }
  return false
}
