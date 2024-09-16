import AsyncStorage from '@react-native-async-storage/async-storage'

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

let _state: Schema = defaults

export async function init() {
  const stored = await readFromStorage()
  if (stored) {
    _state = normalizeData(stored)
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
  _state = normalizeData({
    ..._state,
    [key]: value,
  })
  await writeToStorage(_state)
}
write satisfies PersistedApi['write']

export function onUpdate<K extends keyof Schema>(
  _key: K,
  _cb: (v: Schema[K]) => void,
): () => void {
  return () => {}
}
onUpdate satisfies PersistedApi['onUpdate']

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
clearStorage satisfies PersistedApi['clearStorage']

async function writeToStorage(value: Schema) {
  const rawData = tryStringify(value)
  if (rawData) {
    try {
      await AsyncStorage.setItem(BSKY_STORAGE, rawData)
    } catch (e) {
      logger.error(`persisted state: failed writing root state to storage`, {
        message: e,
      })
    }
  }
}

async function readFromStorage(): Promise<Schema | undefined> {
  let rawData: string | null = null
  try {
    rawData = await AsyncStorage.getItem(BSKY_STORAGE)
  } catch (e) {
    logger.error(`persisted state: failed reading root state from storage`, {
      message: e,
    })
  }
  if (rawData) {
    return tryParse(rawData)
  }
}

function normalizeData(data: Schema) {
  /**
   * Normalize language prefs to ensure that these values only contain 2-letter
   * country codes without region.
   */
  try {
    const next = {...data.languagePrefs}
    next.primaryLanguage = next.primaryLanguage.split('-')[0]
    next.contentLanguages = next.contentLanguages.map(lang =>
      normalizeLocaleToTwoLetterCode(lang),
    )
    next.postLanguage = next.postLanguage
      .split(',')
      .map(lang => normalizeLocaleToTwoLetterCode(lang))
      .filter(Boolean)
      .join(',')
    next.postLanguageHistory = next.postLanguageHistory.map(postLanguage => {
      return postLanguage
        .split(',')
        .map(lang => normalizeLocaleToTwoLetterCode(lang))
        .filter(Boolean)
        .join(',')
    })
    // mutate last in case anything above fails
    data.languagePrefs = next
  } catch (e: any) {
    logger.error(`persisted state: failed to normalize language prefs`, {
      safeMessage: e.message,
    })
  }

  return data
}

function normalizeLocaleToTwoLetterCode(lang: string) {
  return lang.split('-')[0]
}
