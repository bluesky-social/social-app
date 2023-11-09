import {BskyAgent} from '@atproto/api'

let _unstable_agent: BskyAgent

export function unstable_setAgent(agent: BskyAgent) {
  _unstable_agent = agent
}

export function useSession(): {agent: BskyAgent} {
  return {agent: _unstable_agent}
}
