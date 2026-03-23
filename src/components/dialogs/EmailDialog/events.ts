import {useEffect} from 'react'
import EventEmitter from 'eventemitter3'

const events = new EventEmitter<{
  emailVerified: void
}>()

export function emitEmailVerified() {
  events.emit('emailVerified')
}

export function useOnEmailVerified(cb: () => void) {
  useEffect(() => {
    /*
     * N.B. Use `once` here, since the event can fire multiple times for each
     * instance of `useAccountEmailState`
     */
    events.once('emailVerified', cb)
    return () => {
      events.off('emailVerified', cb)
    }
  }, [cb])
}
