import {useEffect} from 'react'

import {IS_WEB_MOBILE_IOS} from '#/env'

const ZOOM_LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover'

/**
 * iOS Safari zooms in when a text input with `font-size < 16px` gains focus.
 * To avoid that while still allowing users to pinch-zoom for accessibility, we
 * only pin `maximum-scale=1` while a text input is focused and restore the
 * original viewport on blur.
 *
 * Listeners run in the capture phase so we update the viewport before iOS
 * commits to auto-zooming the input.
 */
export function useViewportZoomLock({enabled} = {enabled: true}) {
  useEffect(() => {
    if (!IS_WEB_MOBILE_IOS) return
    if (!enabled) return

    const meta = document.querySelector('meta[name="viewport"]')
    if (!(meta instanceof HTMLMetaElement)) return

    const originalContent = meta.content

    const onFocus = (e: FocusEvent) => {
      if (isTextInput(e.target)) {
        meta.content = ZOOM_LOCKED_VIEWPORT
      }
    }

    const onBlur = (e: FocusEvent) => {
      if (isTextInput(e.target)) {
        meta.content = originalContent
      }
    }

    document.addEventListener('focus', onFocus, true)
    document.addEventListener('blur', onBlur, true)

    return () => {
      document.removeEventListener('focus', onFocus, true)
      document.removeEventListener('blur', onBlur, true)
      meta.content = originalContent
    }
  }, [enabled])
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
