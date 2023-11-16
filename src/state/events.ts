import EventEmitter from 'eventemitter3'
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

export function emitSessionLoaded(sessionAccount: SessionAccount) {
  emitter.emit('session-loaded', sessionAccount)
}
export function listenSessionLoaded(
  fn: (sessionAccount: SessionAccount) => void,
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
