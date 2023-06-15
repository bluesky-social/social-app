/**
 * This is a temporary client-side system for storing muted threads
 * When the system lands on prod we should switch to that
 */

import {makeAutoObservable} from 'mobx'
import {isObj, hasProp, isStrArray} from 'lib/type-guards'

export class MutedThreads {
  uris: Set<string> = new Set()

  constructor() {
    makeAutoObservable(
      this,
      {serialize: false, hydrate: false},
      {autoBind: true},
    )
  }

  serialize() {
    return {uris: Array.from(this.uris)}
  }

  hydrate(v: unknown) {
    if (isObj(v) && hasProp(v, 'uris') && isStrArray(v.uris)) {
      this.uris = new Set(v.uris)
    }
  }
}
