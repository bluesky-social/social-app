import Stub from '#/lib/broadcast/stub'
export default 'BroadcastChannel' in window ? window.BroadcastChannel : Stub
