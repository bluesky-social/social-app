import EventEmitter from 'eventemitter3';
var emitter = new EventEmitter();
// a "soft reset" typically means scrolling to top and loading latest
// but it can depend on the screen
export function emitSoftReset() {
    emitter.emit('soft-reset');
}
export function listenSoftReset(fn) {
    emitter.on('soft-reset', fn);
    return function () { return emitter.off('soft-reset', fn); };
}
export function emitSessionDropped() {
    emitter.emit('session-dropped');
}
export function listenSessionDropped(fn) {
    emitter.on('session-dropped', fn);
    return function () { return emitter.off('session-dropped', fn); };
}
export function emitNetworkConfirmed() {
    emitter.emit('network-confirmed');
}
export function listenNetworkConfirmed(fn) {
    emitter.on('network-confirmed', fn);
    return function () { return emitter.off('network-confirmed', fn); };
}
export function emitNetworkLost() {
    emitter.emit('network-lost');
}
export function listenNetworkLost(fn) {
    emitter.on('network-lost', fn);
    return function () { return emitter.off('network-lost', fn); };
}
export function emitPostCreated() {
    emitter.emit('post-created');
}
export function listenPostCreated(fn) {
    emitter.on('post-created', fn);
    return function () { return emitter.off('post-created', fn); };
}
