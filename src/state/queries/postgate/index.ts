import {AppBskyFeedPostgate, AtUri, BskyAgent} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
import {
  createPostgateRecord,
  mergePostgateRecords,
  POSTGATE_COLLECTION,
} from '#/state/queries/postgate/util'
import {useAgent} from '#/state/session'

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
    const {data} = await networkRetry(2, () =>
      agent.api.com.atproto.repo.getRecord({
        repo: urip.host,
        collection: POSTGATE_COLLECTION,
        rkey: urip.rkey,
      }),
    )

    if (data.value && AppBskyFeedPostgate.isRecord(data.value)) {
      return data.value
    } else {
      return undefined
    }
  } catch (e: any) {
    if (e.message.includes(`Could not locate record:`)) {
      return undefined
    } else {
      throw new Error(`Failed to get postgate record`, {cause: e})
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
  const record = createPostgateRecord({
    post: postUri,
    detachedQuotes: postgate.detachedQuotes,
  })

  await networkRetry(2, () =>
    agent.api.com.atproto.repo.putRecord({
      repo: agent.session!.did,
      collection: POSTGATE_COLLECTION,
      rkey: postUrip.rkey,
      record,
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

export function useToggleQuoteDetachmentMutation() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      postUri,
      quotedUri,
      action,
    }: {
      postUri: string
      quotedUri: string
      action: 'detach' | 'reattach'
    }) => {
      await upsertPostgate({agent, postUri: quotedUri}, async prev => {
        if (prev) {
          if (action === 'detach') {
            return mergePostgateRecords(prev, {
              detachedQuotes: [postUri],
            })
          } else if (action === 'reattach') {
            return {
              ...prev,
              detachedQuotes:
                prev.detachedQuotes?.filter(uri => uri !== postUri) || [],
            }
          }
        } else {
          if (action === 'detach') {
            return createPostgateRecord({
              post: quotedUri,
              detachedQuotes: [postUri],
            })
          }
        }
      })
    },
  })
}
