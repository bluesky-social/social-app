import {AuthorFilter} from '#/state/queries/post-feed'

/**
 * Kind of like `FeedDescriptor` but not
 */
export type VideoFeedSourceContext =
  | {type: 'feedgen'; uri: string; initialPostUri?: string}
  | {
      type: 'author'
      did: string
      filter: AuthorFilter
      initialPostUri?: string
    }
