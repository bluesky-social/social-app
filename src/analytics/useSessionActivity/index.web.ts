import {useLayoutEffect} from 'react'
import uuid from 'react-native-uuid'

import {readSessionRecord} from '#/analytics/identifiers/session'
import {IS_DEV} from '#/env'
import {device} from '#/storage'

const TTL = 30 * 60 * 1e3
const ACTIVITY_INTERVAL = 5_000

type Source =
  | 'mount'
  | 'return'
  | 'keydown'
  | 'pointerdown'
  | 'click'
  | 'beforeinput'
  | 'input'
  | 'scroll'
  | 'popstate'

/**
 * Capture above React's root and document listeners, including non-bubbling
 * nested scrolls. Scrolls count regardless of whether input or code caused them.
 */
export function observeSessionActivity() {
  let lastRecordedAt = -Infinity
  const isEngaged = () =>
    document.visibilityState === 'visible' && document.hasFocus()

  function recordActivity(source: Source) {
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
      event.type as
        | 'keydown'
        | 'pointerdown'
        | 'click'
        | 'beforeinput'
        | 'input'
        | 'scroll'
        | 'popstate',
    )
  }

  const listeners = {
    keydown: onActivity,
    pointerdown: onActivity,
    click: onActivity,
    // Run before editor handling, with input as a fallback when beforeinput is absent.
    beforeinput: onActivity,
    input: onActivity,
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

/** Check expiry before recording activity, and publish the result immediately. */
export function recordSessionActivity(source: Source) {
  const current = readSessionRecord()
  const now = Date.now()
  const elapsedMs =
    current?.lastEventAt === undefined ? undefined : now - current.lastEventAt
  const expired = elapsedMs !== undefined && elapsedMs >= TTL
  // Do not mutate the cached validation result returned by readSessionRecord.
  const record = {
    id: !current || expired ? String(uuid.v4()) : current.id,
    lastEventAt: now,
  }
  device.set(['analyticsSession'], record)

  if (
    IS_DEV &&
    (!current || expired || source === 'mount' || source === 'return')
  ) {
    console.debug(`${record.id.slice(-8)} analytics session`, {
      source,
      action: !current ? 'created' : expired ? 'rotated' : 'retained',
      elapsedMs,
    })
  }
}
