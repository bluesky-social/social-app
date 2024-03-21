import EventEmitter from 'eventemitter3'

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

/**
 * Notify listener to focus on a search input, returns a boolean that indicates
 * if it's been captured by one.
 */
export function emitSearchTrigger() {
  emitter.emit('search-trigger')
  return emitter.listenerCount('search-trigger') > 0
}
export function listenSearchTrigger(fn: () => void): UnlistenFn {
  emitter.on('search-trigger', fn)
  return () => emitter.off('search-trigger', fn)
}
