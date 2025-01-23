import {AuthorFilter} from '#/state/queries/post-feed'

/**
 * Kind of like `FeedDescriptor` but not
 */
export type VideoFeedSourceContext =
  | {
      type: 'feedgen'
      uri: string
      sourceInterstitial: 'discover' | 'explore' | 'none'
      initialPostUri?: string
    }
  | {
      type: 'author'
      did: string
      filter: AuthorFilter
      initialPostUri?: string
    }
