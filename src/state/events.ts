import EventEmitter from 'eventemitter3'
import {BskyAgent} from '@atproto/api'
import {SessionAccount} from './session'

type UnlistenFn = () => void

const emitter = new EventEmitter()

// a "soft reset" typically means scrolling to top and loading latest
// but it can depend on the screen
export function emitSoftReset() {
  emitter.emit('soft-reset')
}
export function listenSoftReset(fn: () => void): UnlistenFn {
  emitter.on('soft-reset', fn)
  return () => emitter.off('soft-reset', fn)
}

export function emitSessionLoaded(
  sessionAccount: SessionAccount,
  agent: BskyAgent,
) {
  emitter.emit('session-loaded', sessionAccount, agent)
}
export function listenSessionLoaded(
  fn: (sessionAccount: SessionAccount, agent: BskyAgent) => void,
): UnlistenFn {
  emitter.on('session-loaded', fn)
  return () => emitter.off('session-loaded', fn)
}

export function emitSessionDropped() {
  emitter.emit('session-dropped')
}
export function listenSessionDropped(fn: () => void): UnlistenFn {
  emitter.on('session-dropped', fn)
  return () => emitter.off('session-dropped', fn)
}

export function emitPostCreated() {
  emitter.emit('post-created')
}
export function listenPostCreated(fn: () => void): UnlistenFn {
  emitter.on('post-created', fn)
  return () => emitter.off('post-created', fn)
}
