import EventEmitter from 'eventemitter3'

import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {defaults, Schema, schema, tryParse} from '#/state/persisted/schema'
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
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
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
  try {
    schema.parse(value)
    localStorage.setItem(BSKY_STORAGE, JSON.stringify(value))
  } catch (e) {
    logger.error(`persisted state: failed writing root state to storage`, {
      message: e,
    })
  }
}

function readFromStorage(): Schema | undefined {
  let objData
  try {
    const rawData = localStorage.getItem(BSKY_STORAGE)
    objData = rawData ? JSON.parse(rawData) : undefined
  } catch (e) {
    logger.error('persisted state: failed to load root state from storage', {
      message: e,
    })
  }
  if (objData) {
    return tryParse(objData)
  }
}
