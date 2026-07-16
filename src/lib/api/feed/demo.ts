import {type AppBskyFeedDefs} from '@atproto/api'

import {DEMO_FEED} from '#/lib/demo'
import {type SessionAgent} from '#/state/session'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class DemoFeedAPI implements FeedAPI {
  agent: SessionAgent

  constructor({agent}: {agent: SessionAgent}) {
    this.agent = agent
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    return DEMO_FEED.feed[0]
  }

  async fetch(): Promise<FeedAPIResponse> {
    return DEMO_FEED
  }
}
