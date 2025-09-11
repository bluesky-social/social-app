import EventEmitter from 'eventemitter3'

import {type Device} from '#/storage'

const events = new EventEmitter()
const EVENT = 'geolocation-config-updated'

export const emitGeolocationConfigUpdate = (config: Device['geolocation']) => {
  events.emit(EVENT, config)
}

export const onGeolocationConfigUpdate = (
  listener: (config: Device['geolocation']) => void,
) => {
  events.on(EVENT, listener)
  return () => {
    events.off(EVENT, listener)
  }
}
