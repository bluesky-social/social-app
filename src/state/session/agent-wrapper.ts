import {AtpSessionEvent, BskyAgent} from '@atproto/api'

/**
 * This is a temporary class that wraps `BskyAgent` and allows us to update the session persist handler when needed,
 * since the deprecated `BskyAgent` after the API upgrades for OAuth no longer support setting the handler in the
 * `SessionManager` itself.
 */
export class BskyAgentWrapper extends BskyAgent {
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
