import {AppBskyFeedThreadgate, AtUri, BskyAgent} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
import {
  createThreadgateRecord,
  mergeThreadgateRecords,
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
    async queryFn() {
      const urip = new AtUri(postUri!)

      if (!urip.host.startsWith('did:')) {
        const res = await agent.resolveHandle({
          handle: urip.host,
        })
        urip.host = res.data.did
      }

      const {value} = await agent.api.app.bsky.feed.threadgate.get({
        repo: urip.host,
        rkey: urip.rkey,
      })

      return value
    },
  })
}

export async function getThreadgateRecord({
  agent,
  postUri,
}: {
  agent: BskyAgent
  postUri: string
}): Promise<AppBskyFeedThreadgate.Record | undefined> {
  const postUrip = new AtUri(postUri)

  try {
    const {data} = await networkRetry(2, () =>
      agent.api.com.atproto.repo.getRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.feed.threadgate',
        rkey: postUrip.rkey,
      }),
    )

    if (data.value && AppBskyFeedThreadgate.isRecord(data.value)) {
      return data.value
    }
  } catch (e: any) {
    if (e.message.includes(`Could not locate record:`)) {
      return undefined
    } else {
      throw new Error(`Failed to get threadgate record`, {cause: e})
    }
  }
}

export async function createThreadgate({
  agent,
  postUri,
  threadgate,
}: {
  agent: BskyAgent
  postUri: string
  threadgate: Partial<AppBskyFeedThreadgate.Record>
}) {
  const postUrip = new AtUri(postUri)

  const {data} = await networkRetry(2, () =>
    agent.api.com.atproto.repo.getRecord({
      repo: agent.session!.did,
      collection: 'app.bsky.feed.threadgate',
      rkey: postUrip.rkey,
    }),
  )

  if (data.value && AppBskyFeedThreadgate.isRecord(data.value)) {
    // has existing, merge
    const prev = data.value
    const merged = mergeThreadgateRecords(prev, threadgate)

    await networkRetry(2, () =>
      agent.api.com.atproto.repo.putRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.feed.threadgate',
        rkey: postUrip.rkey,
        record: merged,
      }),
    )
  } else {
    // no existing, create new
    const record: AppBskyFeedThreadgate.Record = {
      $type: 'app.bsky.feed.threadgate',
      post: postUri,
      allow: threadgate.allow || [],
      hiddenReplies: threadgate.hiddenReplies || [],
      createdAt: new Date().toISOString(),
    }

    await networkRetry(2, () =>
      agent.api.com.atproto.repo.putRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.feed.threadgate',
        rkey: postUrip.rkey,
        record,
      }),
    )
  }
}

export async function overwriteThreadgateRecord({
  agent,
  postUri,
  threadgate,
}: {
  agent: BskyAgent
  postUri: string
  threadgate: AppBskyFeedThreadgate.Record
}) {
  const postUrip = new AtUri(postUri)
  const record: AppBskyFeedThreadgate.Record = {
    $type: 'app.bsky.feed.threadgate',
    post: postUri,
    allow: threadgate.allow || [],
    hiddenReplies: threadgate.hiddenReplies || [],
    createdAt: new Date().toISOString(),
  }

  await networkRetry(2, () =>
    agent.api.com.atproto.repo.putRecord({
      repo: agent.session!.did,
      collection: 'app.bsky.feed.threadgate',
      rkey: postUrip.rkey,
      record,
    }),
  )
}

export function useCreateThreadgateMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      postUri,
      threadgate,
    }: {
      postUri: string
      threadgate: Partial<AppBskyFeedThreadgate.Record>
    }) => {
      return createThreadgate({
        agent,
        postUri,
        threadgate,
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [threadgateRecordQueryKeyRoot],
      })
    },
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
      const prev = await getThreadgateRecord({
        agent,
        postUri,
      })

      if (prev) {
        let threadgate = prev

        if (action === 'hide') {
          threadgate = mergeThreadgateRecords(prev, {
            hiddenReplies: [replyUri],
          })
        } else if (action === 'show') {
          threadgate = {
            ...prev,
            hiddenReplies:
              prev.hiddenReplies?.filter(uri => uri !== replyUri) || [],
          }
        }

        await overwriteThreadgateRecord({
          agent,
          postUri,
          threadgate,
        })
      } else {
        if (action === 'hide') {
          const threadgate = createThreadgateRecord({
            post: postUri,
            hiddenReplies: [replyUri],
          })
          await overwriteThreadgateRecord({
            agent,
            postUri,
            threadgate,
          })
        }
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [threadgateRecordQueryKeyRoot],
      })
    },
  })
}
