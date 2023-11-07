import EventEmitter from 'eventemitter3'
import {logger} from '#/logger'
import {defaults, Schema} from '#/state/persisted/schema'
import {migrate} from '#/state/persisted/legacy'
import * as store from '#/state/persisted/store'
import BroadcastChannel from '#/state/persisted/broadcast'

export type {Schema} from '#/state/persisted/schema'
export {defaults as schema} from '#/state/persisted/schema'

const broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL')
const UPDATE_EVENT = 'BSKY_UPDATE'

let _state: Schema = defaults
const _emitter = new EventEmitter()

/**
 * Initializes and returns persisted data state, so that it can be passed to
 * the Provider.
 */
export async function init() {
  logger.debug('persisted state: initializing')

  broadcast.onmessage = onBroadcastMessage

  try {
    await migrate() // migrate old store
    const stored = await store.read() // check for new store
    if (!stored) await store.write(defaults) // opt: init new store
    _state = stored || defaults // return new store
  } catch (e) {
    logger.error('persisted state: failed to load root state from storage', {
      error: e,
    })
    // AsyncStorage failured, but we can still continue in memory
    return defaults
  }
}

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}

export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  try {
    _state[key] = value
    await store.write(_state)
    // must happen on next tick, otherwise the tab will read stale storage data
    setTimeout(() => broadcast.postMessage({event: UPDATE_EVENT}), 0)
    logger.debug(`persisted state: wrote root state to storage`)
  } catch (e) {
    logger.error(`persisted state: failed writing root state to storage`, {
      error: e,
    })
  }
}

export function onUpdate(cb: () => void): () => void {
  _emitter.addListener('update', cb)
  return () => _emitter.removeListener('update', cb)
}

async function onBroadcastMessage({data}: MessageEvent) {
  // validate event
  if (typeof data === 'object' && data.event === UPDATE_EVENT) {
    try {
      // read next state, possibly updated by another tab
      const next = await store.read()

      if (next) {
        logger.debug(`persisted state: handling update from broadcast channel`)
        _state = next
        _emitter.emit('update')
      } else {
        logger.error(
          `persisted state: handled update update from broadcast channel, but found no data`,
        )
      }
    } catch (e) {
      logger.error(
        `persisted state: failed handling update from broadcast channel`,
        {
          error: e,
        },
      )
    }
  }
}
