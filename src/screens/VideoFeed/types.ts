import {type AuthorFilter} from '#/state/queries/post-feed'

/**
 * Kind of like `FeedDescriptor` but not
 */
export type VideoFeedSourceContext =
  | {
      type: 'feedgen'
      uri: string
      sourceInterstitial: 'discover' | 'explore' | 'none'
      initialPostUri?: string
      /**
       * Opened from the Following v2 fork of Home, which caches its feeds
       * under its own query key.
       */
      followingV2?: boolean
    }
  | {
      type: 'author'
      did: string
      filter: AuthorFilter
      initialPostUri?: string
    }
