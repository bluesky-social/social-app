import {type QueryClient} from '@tanstack/react-query'

import {mutatePost} from '#/state/queries/cache/mutations'
import {type PostMutations} from '#/state/queries/cache/types'
import {applyPostCacheMutator as applyPostCacheMutator_usePostThread} from '#/state/queries/usePostThread/queryCache'

/**
 * Applies mutations to a post (identified by URI) in all active query caches
 */
export function applyPostCacheMutations(
  qc: QueryClient,
  uri: string,
  mutations: Partial<PostMutations>,
) {
  applyPostCacheMutator_usePostThread({
    qc,
    uri,
    mutator: post => mutatePost(post, mutations),
  })

  // ... add all other queries below
}
