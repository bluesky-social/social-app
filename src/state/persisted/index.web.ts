import AsyncStorage from '@react-native-async-storage/async-storage'
import EventEmitter from 'eventemitter3'

import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {defaults, Schema, schema} from '#/state/persisted/schema'
export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

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
    const stored = await readFromStorage()
    if (!stored) {
      logger.debug('persisted state: initializing default storage')
      await writeToStorage(defaults) // opt: init new store
    }
    _state = stored || defaults // return new store
    logger.debug('persisted state: initialized')
  } catch (e) {
    logger.error('persisted state: failed to load root state from storage', {
      message: e,
    })
    // AsyncStorage failure, but we can still continue in memory
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
    await writeToStorage(_state)
    // must happen on next tick, otherwise the tab will read stale storage data
    setTimeout(() => broadcast.postMessage({event: UPDATE_EVENT}), 0)
    logger.debug(`persisted state: wrote root state to storage`, {
      updatedKey: key,
    })
  } catch (e) {
    logger.error(`persisted state: failed writing root state to storage`, {
      message: e,
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
      const next = await readFromStorage()

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
          message: e,
        },
      )
    }
  }
}

async function writeToStorage(value: Schema) {
  schema.parse(value)
  await AsyncStorage.setItem(BSKY_STORAGE, JSON.stringify(value))
}

async function readFromStorage(): Promise<Schema | undefined> {
  const rawData = await AsyncStorage.getItem(BSKY_STORAGE)
  const objData = rawData ? JSON.parse(rawData) : undefined

  // new user
  if (!objData) return undefined

  // existing user, validate
  const parsed = schema.safeParse(objData)

  if (parsed.success) {
    return objData
  } else {
    const errors =
      parsed.error?.errors?.map(e => ({
        code: e.code,
        // @ts-ignore exists on some types
        expected: e?.expected,
        path: e.path?.join('.'),
      })) || []
    logger.error(`persisted store: data failed validation on read`, {errors})
    return undefined
  }
}

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
