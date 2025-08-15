import React from 'react'
import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  AppBskyFeedPostgate,
  AtUri,
  type BskyAgent,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {networkRetry, retry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {STALE} from '#/state/queries'
import {useGetPosts} from '#/state/queries/post'
import {
  createMaybeDetachedQuoteEmbed,
  createPostgateRecord,
  mergePostgateRecords,
  POSTGATE_COLLECTION,
} from '#/state/queries/postgate/util'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'

export async function getPostgateRecord({
  agent,
  postUri,
}: {
  agent: BskyAgent
  postUri: string
}): Promise<AppBskyFeedPostgate.Record | undefined> {
  const urip = new AtUri(postUri)

  if (!urip.host.startsWith('did:')) {
    const res = await agent.resolveHandle({
      handle: urip.host,
    })
    urip.host = res.data.did
  }

  try {
    const {data} = await retry(
      2,
      e => {
        /*
         * If the record doesn't exist, we want to return null instead of
         * throwing an error. NB: This will also catch reference errors, such as
         * a typo in the URI.
         */
        if (e.message.includes(`Could not locate record:`)) {
          return false
        }
        return true
      },
      () =>
        agent.api.com.atproto.repo.getRecord({
          repo: urip.host,
          collection: POSTGATE_COLLECTION,
          rkey: urip.rkey,
        }),
    )

    if (
      data.value &&
      bsky.validate(data.value, AppBskyFeedPostgate.validateRecord)
    ) {
      return data.value
    } else {
      return undefined
    }
  } catch (e: any) {
    /*
     * If the record doesn't exist, we want to return null instead of
     * throwing an error. NB: This will also catch reference errors, such as
     * a typo in the URI.
     */
    if (e.message.includes(`Could not locate record:`)) {
      return undefined
    } else {
      throw e
    }
  }
}

export async function writePostgateRecord({
  agent,
  postUri,
  postgate,
}: {
  agent: BskyAgent
  postUri: string
  postgate: AppBskyFeedPostgate.Record
}) {
  const postUrip = new AtUri(postUri)

  await networkRetry(2, () =>
    agent.api.com.atproto.repo.putRecord({
      repo: agent.session!.did,
      collection: POSTGATE_COLLECTION,
      rkey: postUrip.rkey,
      record: postgate,
    }),
  )
}

export async function upsertPostgate(
  {
    agent,
    postUri,
  }: {
    agent: BskyAgent
    postUri: string
  },
  callback: (
    postgate: AppBskyFeedPostgate.Record | undefined,
  ) => Promise<AppBskyFeedPostgate.Record | undefined>,
) {
  const prev = await getPostgateRecord({
    agent,
    postUri,
  })
  const next = await callback(prev)
  if (!next) return
  await writePostgateRecord({
    agent,
    postUri,
    postgate: next,
  })
}

export const createPostgateQueryKey = (postUri: string) => [
  'postgate-record',
  postUri,
]
export function usePostgateQuery({postUri}: {postUri: string}) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: createPostgateQueryKey(postUri),
    async queryFn() {
      return await getPostgateRecord({agent, postUri}).then(res => res ?? null)
    },
  })
}

export function useWritePostgateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postUri,
      postgate,
    }: {
      postUri: string
      postgate: AppBskyFeedPostgate.Record
    }) => {
      return writePostgateRecord({
        agent,
        postUri,
        postgate,
      })
    },
    onSuccess(_, {postUri}) {
      queryClient.invalidateQueries({
        queryKey: createPostgateQueryKey(postUri),
      })
    },
  })
}

export function useToggleQuoteDetachmentMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const getPosts = useGetPosts()
  const prevEmbed = React.useRef<AppBskyFeedDefs.PostView['embed']>()

  return useMutation({
    mutationFn: async ({
      post,
      quoteUri,
      action,
    }: {
      post: AppBskyFeedDefs.PostView
      quoteUri: string
      action: 'detach' | 'reattach'
    }) => {
      // cache here since post shadow mutates original object
      prevEmbed.current = post.embed

      if (action === 'detach') {
        updatePostShadow(queryClient, post.uri, {
          embed: createMaybeDetachedQuoteEmbed({
            post,
            quote: undefined,
            quoteUri,
            detached: true,
          }),
        })
      }

      await upsertPostgate({agent, postUri: quoteUri}, async prev => {
        if (prev) {
          if (action === 'detach') {
            return mergePostgateRecords(prev, {
              detachedEmbeddingUris: [post.uri],
            })
          } else if (action === 'reattach') {
            return {
              ...prev,
              detachedEmbeddingUris:
                prev.detachedEmbeddingUris?.filter(uri => uri !== post.uri) ||
                [],
            }
          }
        } else {
          if (action === 'detach') {
            return createPostgateRecord({
              post: quoteUri,
              detachedEmbeddingUris: [post.uri],
            })
          }
        }
      })
    },
    async onSuccess(_data, {post, quoteUri, action}) {
      if (action === 'reattach') {
        try {
          const [quote] = await getPosts({uris: [quoteUri]})
          updatePostShadow(queryClient, post.uri, {
            embed: createMaybeDetachedQuoteEmbed({
              post,
              quote,
              quoteUri: undefined,
              detached: false,
            }),
          })
        } catch (e: any) {
          // ok if this fails, it's just optimistic UI
          logger.error(`Postgate: failed to get quote post for re-attachment`, {
            safeMessage: e.message,
          })
        }
      }
    },
    onError(_, {post, action}) {
      if (action === 'detach' && prevEmbed.current) {
        // detach failed, add the embed back
        if (
          AppBskyEmbedRecord.isView(prevEmbed.current) ||
          AppBskyEmbedRecordWithMedia.isView(prevEmbed.current)
        ) {
          updatePostShadow(queryClient, post.uri, {
            embed: prevEmbed.current,
          })
        }
      }
    },
    onSettled() {
      prevEmbed.current = undefined
    },
  })
}

export function useToggleQuotepostEnabledMutation() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      postUri,
      action,
    }: {
      postUri: string
      action: 'enable' | 'disable'
    }) => {
      await upsertPostgate({agent, postUri: postUri}, async prev => {
        if (prev) {
          if (action === 'disable') {
            return mergePostgateRecords(prev, {
              embeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
            })
          } else if (action === 'enable') {
            return {
              ...prev,
              embeddingRules: [],
            }
          }
        } else {
          if (action === 'disable') {
            return createPostgateRecord({
              post: postUri,
              embeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
            })
          }
        }
      })
    },
  })
}
