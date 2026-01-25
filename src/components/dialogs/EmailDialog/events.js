import { useEffect } from 'react';
import EventEmitter from 'eventemitter3';
var events = new EventEmitter();
export function emitEmailVerified() {
    events.emit('emailVerified');
}
export function useOnEmailVerified(cb) {
    useEffect(function () {
        /*
         * N.B. Use `once` here, since the event can fire multiple times for each
         * instance of `useAccountEmailState`
         */
        events.once('emailVerified', cb);
        return function () {
            events.off('emailVerified', cb);
        };
    }, [cb]);
}
