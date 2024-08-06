import {AppBskyFeedThreadgate, AtUri, BskyAgent} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
import {STALE} from '#/state/queries'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {
  createThreadgateRecord,
  mergeThreadgateRecords,
  threadgateAllowUISettingToAllowRecordValue,
} from '#/state/queries/threadgate/util'
import {useAgent} from '#/state/session'

export * from '#/state/queries/threadgate/types'
export * from '#/state/queries/threadgate/util'

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
    const {data} = await networkRetry(2, () =>
      agent.api.com.atproto.repo.getRecord({
        repo: urip.host,
        collection: 'app.bsky.feed.threadgate',
        rkey: urip.rkey,
      }),
    )

    if (data.value && AppBskyFeedThreadgate.isRecord(data.value)) {
      return data.value
    } else {
      return null
    }
  } catch (e: any) {
    if (e.message.includes(`Could not locate record:`)) {
      return null
    } else {
      throw new Error(`Failed to get threadgate record`, {cause: e})
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

export function useToggleReplyVisibilityMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

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
  })
}
