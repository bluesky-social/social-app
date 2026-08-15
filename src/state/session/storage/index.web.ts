/**
 * Secure session storage is native-only: the web build keeps using the
 * persisted blob alone. These no-ops exist so the call sites need no platform
 * branching.
 */
import {type Schema} from '#/state/persisted'
import {type SessionStorageBootReport} from './boot'

export function initSessionStorage(): void {}

export function mirrorSessionSnapshot(_data: Schema['session']): void {}

export function clearSessionStorage(): void {}

export function consumeSessionStorageBootReport():
  SessionStorageBootReport | undefined {
  return undefined
}
