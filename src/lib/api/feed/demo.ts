import {type AppBskyFeedDefs} from '@atproto/api'
import {type Client} from '@atproto/lex'

import {DEMO_FEED} from '#/lib/demo'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class DemoFeedAPI implements FeedAPI {
  client: Client

  constructor({client}: {client: Client}) {
    this.client = client
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    return DEMO_FEED.feed[0]
  }

  async fetch(): Promise<FeedAPIResponse> {
    return DEMO_FEED
  }
}
