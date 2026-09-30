import {useLayoutEffect} from 'react'

import {recordSessionActivity} from '#/analytics/useSessionActivity/activity'

const ACTIVITY_INTERVAL = 5_000

/**
 * Capture above React's root and document listeners, including non-bubbling
 * nested scrolls. Scrolls count regardless of whether input or code caused them.
 */
export function observeSessionActivity() {
  let lastRecordedAt = -Infinity
  const isEngaged = () =>
    document.visibilityState === 'visible' && document.hasFocus()

  function recordActivity(source: Parameters<typeof recordSessionActivity>[0]) {
    const now = Date.now()
    if (now >= lastRecordedAt && now - lastRecordedAt < ACTIVITY_INTERVAL)
      return
    recordSessionActivity(source)
    lastRecordedAt = now
  }

  function onReturn() {
    // A suspended tab may return without having delivered a departure event.
    if (isEngaged()) recordActivity('return')
  }

  function onFocus(event: Event) {
    // Element focus also passes through the window capture listener.
    if (event.target === window) onReturn()
  }

  function onActivity(event: Event) {
    if (!event.isTrusted || !isEngaged()) return
    recordActivity(
      event.type as 'keydown' | 'pointerdown' | 'scroll' | 'popstate',
    )
  }

  const listeners = {
    keydown: onActivity,
    pointerdown: onActivity,
    scroll: onActivity,
    popstate: onActivity,
    focus: onFocus,
    visibilitychange: onReturn,
    pageshow: onReturn,
  }
  for (const [name, listener] of Object.entries(listeners)) {
    window.addEventListener(name, listener, {capture: true, passive: true})
  }
  if (isEngaged()) recordActivity('mount')

  return () => {
    for (const [name, listener] of Object.entries(listeners)) {
      window.removeEventListener(name, listener, true)
    }
  }
}

/** Mounted once at the app root, above account-specific remounts. */
export function useSessionActivity() {
  useLayoutEffect(observeSessionActivity, [])
}
