import uuid from 'react-native-uuid'

import {readSessionRecord} from '#/analytics/identifiers/session'
import {IS_DEV} from '#/env'
import {device} from '#/storage'

const TTL = 30 * 60 * 1e3

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
