import {type Client} from '@atproto/lex-client'

import {DEMO_FEED} from '#/lib/demo'
import {type app} from '#/lexicons'
import {toLex} from '#/types/bsky'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class DemoFeedAPI implements FeedAPI {
  client: Client

  constructor({client}: {client: Client}) {
    this.client = client
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    /*
     * TODO(phase4): drop this cast once `#/lib/demo` (DEMO_FEED) sources its
     * feed items from `#/lexicons`. Its records are still typed against the old
     * `@atproto/api` FeedViewPost, which does not assign to the branded lexicon
     * type this method must return.
     */
    return toLex(DEMO_FEED.feed[0])
  }

  async fetch(): Promise<FeedAPIResponse> {
    return toLex(DEMO_FEED)
  }
}
