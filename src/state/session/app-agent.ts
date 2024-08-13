import {AtpSessionEvent, BskyAgent} from '@atproto/api'

export class BskyAppAgent extends BskyAgent {
  persistSessionHandler: ((event: AtpSessionEvent) => void) | undefined =
    undefined

  constructor({service}: {service: string}) {
    super({
      service,
      persistSession: (event: AtpSessionEvent) => {
        if (this.persistSessionHandler) {
          this.persistSessionHandler(event)
        }
      },
    })
  }

  setPersistSessionHandler(handler?: (event: AtpSessionEvent) => void) {
    this.persistSessionHandler = handler
  }

  dispose() {
    this.sessionManager.session = undefined
    this.persistSessionHandler = undefined
  }
}
