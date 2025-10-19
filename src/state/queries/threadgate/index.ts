import {
  type AppBskyFeedDefs,
  AppBskyFeedThreadgate,
  AtUri,
  type BskyAgent,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {networkRetry, retry} from '#/lib/async/retry'
import {STALE} from '#/state/queries'
import {useGetPost} from '#/state/queries/post'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {
  createThreadgateRecord,
  mergeThreadgateRecords,
  threadgateAllowUISettingToAllowRecordValue,
  threadgateViewToAllowUISetting,
} from '#/state/queries/threadgate/util'
import {useUpdatePostThreadThreadgateQueryCache} from '#/state/queries/usePostThread'
import {useAgent} from '#/state/session'
import {useThreadgateHiddenReplyUrisAPI} from '#/state/threadgate-hidden-replies'
import * as bsky from '#/types/bsky'

export * from '#/state/queries/threadgate/types'
export * from '#/state/queries/threadgate/util'

/**
 * Must match the threadgate lexicon record definition.
 */
export const MAX_HIDDEN_REPLIES = 300

export const threadgateRecordQueryKeyRoot = 'threadgate-record'
export const createThreadgateRecordQueryKey = (uri: string) => [
  threadgateRecordQueryKeyRoot,
  uri,
]

export function useThreadgateRecordQuery({
  postUri,
  initialData,
}: {
  postUri?: string
  initialData?: AppBskyFeedThreadgate.Record
} = {}) {
  const agent = useAgent()

  return useQuery({
    enabled: !!postUri,
    queryKey: createThreadgateRecordQueryKey(postUri || ''),
    placeholderData: initialData,
    staleTime: STALE.MINUTES.ONE,
    async queryFn() {
      return getThreadgateRecord({
        agent,
        postUri: postUri!,
      })
    },
  })
}

export const threadgateViewQueryKeyRoot = 'threadgate-view'
export const createThreadgateViewQueryKey = (uri: string) => [
  threadgateViewQueryKeyRoot,
  uri,
]
export function useThreadgateViewQuery({
  postUri,
  initialData,
}: {
  postUri?: string
  initialData?: AppBskyFeedDefs.ThreadgateView
} = {}) {
  const getPost = useGetPost()

  return useQuery({
    enabled: !!postUri,
    queryKey: createThreadgateViewQueryKey(postUri || ''),
    placeholderData: initialData,
    staleTime: STALE.MINUTES.ONE,
    async queryFn() {
      const post = await getPost({uri: postUri!})
      return post.threadgate ?? null
    },
  })
}

export async function getThreadgateRecord({
  agent,
  postUri,
}: {
  agent: BskyAgent
  postUri: string
}): Promise<AppBskyFeedThreadgate.Record | null> {
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
          collection: 'app.bsky.feed.threadgate',
          rkey: urip.rkey,
        }),
    )

    if (
      data.value &&
      bsky.validate(data.value, AppBskyFeedThreadgate.validateRecord)
    ) {
      return data.value
    } else {
      return null
    }
  } catch (e: any) {
    /*
     * If the record doesn't exist, we want to return null instead of
     * throwing an error. NB: This will also catch reference errors, such as
     * a typo in the URI.
     */
    if (e.message.includes(`Could not locate record:`)) {
      return null
    } else {
      throw e
    }
  }
}

export async function writeThreadgateRecord({
  agent,
  postUri,
  threadgate,
}: {
  agent: BskyAgent
  postUri: string
  threadgate: AppBskyFeedThreadgate.Record
}) {
  const postUrip = new AtUri(postUri)
  const record = createThreadgateRecord({
    post: postUri,
    allow: threadgate.allow, // can/should be undefined!
    hiddenReplies: threadgate.hiddenReplies || [],
  })

  await networkRetry(2, () =>
    agent.api.com.atproto.repo.putRecord({
      repo: agent.session!.did,
      collection: 'app.bsky.feed.threadgate',
      rkey: postUrip.rkey,
      record,
    }),
  )
}

export async function upsertThreadgate(
  {
    agent,
    postUri,
  }: {
    agent: BskyAgent
    postUri: string
  },
  callback: (
    threadgate: AppBskyFeedThreadgate.Record | null,
  ) => Promise<AppBskyFeedThreadgate.Record | undefined>,
) {
  const prev = await getThreadgateRecord({
    agent,
    postUri,
  })
  const next = await callback(prev)
  if (!next) return
  validateThreadgateRecordOrThrow(next)
  await writeThreadgateRecord({
    agent,
    postUri,
    threadgate: next,
  })
}

/**
 * Update the allow list for a threadgate record.
 */
export async function updateThreadgateAllow({
  agent,
  postUri,
  allow,
}: {
  agent: BskyAgent
  postUri: string
  allow: ThreadgateAllowUISetting[]
}) {
  return upsertThreadgate({agent, postUri}, async prev => {
    if (prev) {
      return {
        ...prev,
        allow: threadgateAllowUISettingToAllowRecordValue(allow),
      }
    } else {
      return createThreadgateRecord({
        post: postUri,
        allow: threadgateAllowUISettingToAllowRecordValue(allow),
      })
    }
  })
}

export function useSetThreadgateAllowMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const getPost = useGetPost()
  const updatePostThreadThreadgate = useUpdatePostThreadThreadgateQueryCache()

  return useMutation({
    mutationFn: async ({
      postUri,
      allow,
    }: {
      postUri: string
      allow: ThreadgateAllowUISetting[]
    }) => {
      return upsertThreadgate({agent, postUri}, async prev => {
        if (prev) {
          return {
            ...prev,
            allow: threadgateAllowUISettingToAllowRecordValue(allow),
          }
        } else {
          return createThreadgateRecord({
            post: postUri,
            allow: threadgateAllowUISettingToAllowRecordValue(allow),
          })
        }
      })
    },
    async onSuccess(_, {postUri, allow}) {
      const data = await retry<AppBskyFeedDefs.ThreadgateView | undefined>(
        5, // 5 tries
        _e => true,
        async () => {
          const post = await getPost({uri: postUri})
          const threadgate = post.threadgate
          if (!threadgate) {
            throw new Error(
              `useSetThreadgateAllowMutation: could not fetch threadgate, appview may not be ready yet`,
            )
          }
          const fetchedSettings = threadgateViewToAllowUISetting(threadgate)
          const isReady =
            JSON.stringify(fetchedSettings) === JSON.stringify(allow)
          if (!isReady) {
            throw new Error(
              `useSetThreadgateAllowMutation: appview isn't ready yet`,
            ) // try again
          }
          return threadgate
        },
        1e3, // 1s delay between tries
      ).catch(() => {})

      if (data) updatePostThreadThreadgate(data)

      queryClient.invalidateQueries({
        queryKey: [threadgateRecordQueryKeyRoot],
      })
      queryClient.invalidateQueries({
        queryKey: [threadgateViewQueryKeyRoot],
      })
    },
  })
}

export function useToggleReplyVisibilityMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const hiddenReplies = useThreadgateHiddenReplyUrisAPI()

  return useMutation({
    mutationFn: async ({
      postUri,
      replyUri,
      action,
    }: {
      postUri: string
      replyUri: string
      action: 'hide' | 'show'
    }) => {
      if (action === 'hide') {
        hiddenReplies.addHiddenReplyUri(replyUri)
      } else if (action === 'show') {
        hiddenReplies.removeHiddenReplyUri(replyUri)
      }

      await upsertThreadgate({agent, postUri}, async prev => {
        if (prev) {
          if (action === 'hide') {
            return mergeThreadgateRecords(prev, {
              hiddenReplies: [replyUri],
            })
          } else if (action === 'show') {
            return {
              ...prev,
              hiddenReplies:
                prev.hiddenReplies?.filter(uri => uri !== replyUri) || [],
            }
          }
        } else {
          if (action === 'hide') {
            return createThreadgateRecord({
              post: postUri,
              hiddenReplies: [replyUri],
            })
          }
        }
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [threadgateRecordQueryKeyRoot],
      })
    },
    onError(_, {replyUri, action}) {
      if (action === 'hide') {
        hiddenReplies.removeHiddenReplyUri(replyUri)
      } else if (action === 'show') {
        hiddenReplies.addHiddenReplyUri(replyUri)
      }
    },
  })
}

export class MaxHiddenRepliesError extends Error {
  constructor(message?: string) {
    super(message || 'Maximum number of hidden replies reached')
    this.name = 'MaxHiddenRepliesError'
  }
}

export class InvalidInteractionSettingsError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid interaction settings')
    this.name = 'InvalidInteractionSettingsError'
  }
}

export function validateThreadgateRecordOrThrow(
  record: AppBskyFeedThreadgate.Record,
) {
  const result = AppBskyFeedThreadgate.validateRecord(record)

  if (result.success) {
    if ((result.value.hiddenReplies?.length ?? 0) > MAX_HIDDEN_REPLIES) {
      throw new MaxHiddenRepliesError()
    }
  } else {
    throw new InvalidInteractionSettingsError()
  }
}
