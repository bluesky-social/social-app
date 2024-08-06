import EventEmitter from 'eventemitter3'

import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {
  defaults,
  Schema,
  tryParse,
  tryStringify,
} from '#/state/persisted/schema'
import {PersistedApi} from './types'

export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

const broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL')
const UPDATE_EVENT = 'BSKY_UPDATE'

let _state: Schema = defaults
const _emitter = new EventEmitter()

export async function init() {
  broadcast.onmessage = onBroadcastMessage
  const stored = readFromStorage()
  if (stored) {
    _state = stored
  }
}
init satisfies PersistedApi['init']

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
get satisfies PersistedApi['get']

export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  const next = readFromStorage()
  if (next) {
    // The storage could have been updated by a different tab before this tab is notified.
    // Make sure this write is applied on top of the latest data in the storage as long as it's valid.
    _state = next
    // Don't fire the update listeners yet to avoid a loop.
    // If there was a change, we'll receive the broadcast event soon enough which will do that.
  }
  _state = {
    ..._state,
    [key]: value,
  }
  writeToStorage(_state)
  broadcast.postMessage({event: UPDATE_EVENT})
}
write satisfies PersistedApi['write']

export function onUpdate(cb: () => void): () => void {
  _emitter.addListener('update', cb)
  return () => _emitter.removeListener('update', cb)
}
onUpdate satisfies PersistedApi['onUpdate']

export async function clearStorage() {
  try {
    localStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    // Expected on the web in private mode.
  }
}
clearStorage satisfies PersistedApi['clearStorage']

async function onBroadcastMessage({data}: MessageEvent) {
  if (typeof data === 'object' && data.event === UPDATE_EVENT) {
    // read next state, possibly updated by another tab
    const next = readFromStorage()
    if (next) {
      _state = next
      _emitter.emit('update')
    } else {
      logger.error(
        `persisted state: handled update update from broadcast channel, but found no data`,
      )
    }
  }
}

function writeToStorage(value: Schema) {
  const rawData = tryStringify(value)
  if (rawData) {
    try {
      localStorage.setItem(BSKY_STORAGE, rawData)
    } catch (e) {
      // Expected on the web in private mode.
    }
  }
}

let lastRawData: string | undefined
let lastResult: Schema | undefined
function readFromStorage(): Schema | undefined {
  let rawData: string | null = null
  try {
    rawData = localStorage.getItem(BSKY_STORAGE)
  } catch (e) {
    // Expected on the web in private mode.
  }
  if (rawData) {
    if (rawData === lastRawData) {
      return lastResult
    } else {
      const result = tryParse(rawData)
      lastRawData = rawData
      lastResult = result
      return result
    }
  }
}
