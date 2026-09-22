import {EventEmitter} from 'eventemitter3'

const events = new EventEmitter<{complete: [targetDid: string]}>()

/** Return results to an open dialog without putting a function in a URL. */
export function completeStarterPackWizard(targetDid: string) {
  events.emit('complete', targetDid)
}

export function listenStarterPackWizardComplete(
  callback: (targetDid: string) => void,
) {
  events.on('complete', callback)
  return () => {
    events.off('complete', callback)
  }
}
