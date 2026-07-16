import {useRef} from 'react'
import {type Client} from '@atproto/lex-client'
import {AtUri} from '@atproto/syntax'
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
import {usePdsClient} from '#/state/session'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export async function getPostgateRecord({
  pdsClient,
  postUri,
}: {
  pdsClient: Client
  postUri: string
}): Promise<app.bsky.feed.postgate.Main | undefined> {
  const urip = new AtUri(postUri)

  if (!urip.host.startsWith('did:')) {
    const {did} = await pdsClient.call(com.atproto.identity.resolveHandle, {
      handle: urip.host as `${string}.${string}`,
    })
    urip.host = did
  }

  try {
    const data = await retry(
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
        pdsClient.call(com.atproto.repo.getRecord, {
          repo: urip.host,
          collection: POSTGATE_COLLECTION,
          rkey: urip.rkey,
        }),
    )

    if (data.value && bsky.matches(app.bsky.feed.postgate, data.value)) {
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
  pdsClient,
  postUri,
  postgate,
}: {
  pdsClient: Client
  postUri: string
  postgate: app.bsky.feed.postgate.Main
}) {
  const postUrip = new AtUri(postUri)

  await networkRetry(2, () =>
    pdsClient.call(com.atproto.repo.putRecord, {
      repo: pdsClient.assertDid,
      collection: POSTGATE_COLLECTION,
      rkey: postUrip.rkey,
      record: postgate,
    }),
  )
}

export async function upsertPostgate(
  {
    pdsClient,
    postUri,
  }: {
    pdsClient: Client
    postUri: string
  },
  callback: (
    postgate: app.bsky.feed.postgate.Main | undefined,
  ) => Promise<app.bsky.feed.postgate.Main | undefined>,
) {
  const prev = await getPostgateRecord({
    pdsClient,
    postUri,
  })
  const next = await callback(prev)
  if (!next) return
  await writePostgateRecord({
    pdsClient,
    postUri,
    postgate: next,
  })
}

export const createPostgateQueryKey = (postUri: string) => [
  'postgate-record',
  postUri,
]
export function usePostgateQuery({postUri}: {postUri: string}) {
  const pdsClient = usePdsClient()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: createPostgateQueryKey(postUri),
    async queryFn() {
      return await getPostgateRecord({pdsClient, postUri}).then(
        res => res ?? null,
      )
    },
  })
}

export function useWritePostgateMutation() {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postUri,
      postgate,
    }: {
      postUri: string
      postgate: app.bsky.feed.postgate.Main
    }) => {
      return writePostgateRecord({
        pdsClient,
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
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  const getPosts = useGetPosts()
  const prevEmbed = useRef<app.bsky.feed.defs.PostView['embed']>(undefined)

  return useMutation({
    mutationFn: async ({
      post,
      quoteUri,
      action,
    }: {
      post: app.bsky.feed.defs.PostView
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

      await upsertPostgate({pdsClient, postUri: quoteUri}, async prev => {
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
          bsky.isType(app.bsky.embed.record.view, prevEmbed.current) ||
          bsky.isType(app.bsky.embed.recordWithMedia.view, prevEmbed.current)
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
  const pdsClient = usePdsClient()

  return useMutation({
    mutationFn: async ({
      postUri,
      action,
    }: {
      postUri: string
      action: 'enable' | 'disable'
    }) => {
      await upsertPostgate({pdsClient, postUri: postUri}, async prev => {
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
