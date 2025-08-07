import {type AppGndrFeedDefs, type GndrAgent} from '@gander-social-atproto/api'

import {DEMO_FEED} from '#/lib/demo'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class DemoFeedAPI implements FeedAPI {
  agent: GndrAgent

  constructor({agent}: {agent: GndrAgent}) {
    this.agent = agent
  }

  async peekLatest(): Promise<AppGndrFeedDefs.FeedViewPost> {
    return DEMO_FEED.feed[0]
  }

  async fetch(): Promise<FeedAPIResponse> {
    return DEMO_FEED
  }
}
