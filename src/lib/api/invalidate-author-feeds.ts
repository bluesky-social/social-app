import {QueryClient} from '@tanstack/react-query'

import {FeedDescriptor, RQKEY_ROOT} from '#/state/queries/post-feed'

export function invalidateAuthorFeeds(did: string, queryClient: QueryClient) {
  const authorFilters = [
    'posts_and_author_threads',
    'posts_no_replies',
    'posts_with_replies',
    'posts_with_media',
  ] as const
  for (const filter of authorFilters) {
    queryClient.invalidateQueries({
      queryKey: [
        RQKEY_ROOT,
        `author|${did}|${filter}` satisfies FeedDescriptor,
      ],
    })
  }
}
