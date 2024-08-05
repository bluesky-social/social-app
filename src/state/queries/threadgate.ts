import {
  AppBskyFeedDefs,
  AppBskyFeedThreadgate,
  AtUri,
  BskyAgent,
} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export type ThreadgateAllowUISetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: unknown}

/**
 * Converts a full {@link AppBskyFeedThreadgate.Record} to a list of
 * {@link ThreadgateAllowUISetting}, for use by app UI.
 */
export function threadgateViewToAllowUISetting(
  threadgate: AppBskyFeedDefs.ThreadgateView | undefined,
): ThreadgateAllowUISetting[] {
  const record =
    threadgate &&
    AppBskyFeedThreadgate.isRecord(threadgate.record) &&
    AppBskyFeedThreadgate.validateRecord(threadgate.record).success
      ? threadgate.record
      : null
  if (!record) {
    return []
  }
  if (!record.allow?.length) {
    return [{type: 'nobody'}]
  }
  const settings: ThreadgateAllowUISetting[] = record.allow
    .map(allow => {
      let setting: ThreadgateAllowUISetting | undefined
      if (allow.$type === 'app.bsky.feed.threadgate#mentionRule') {
        setting = {type: 'mention'}
      } else if (allow.$type === 'app.bsky.feed.threadgate#followingRule') {
        setting = {type: 'following'}
      } else if (allow.$type === 'app.bsky.feed.threadgate#listRule') {
        setting = {type: 'list', list: allow.list}
      }
      return setting
    })
    .filter(n => !!n)
  return settings
}

/**
 * Converts a list of {@link ThreadgateAllowUISetting} to the `allow` prop on
 * {@link AppBskyFeedThreadgate.Record},
 */
export function threadgateAllowUISettingToAllowType(
  threadgate: ThreadgateAllowUISetting[],
) {
  let allow: (
    | AppBskyFeedThreadgate.MentionRule
    | AppBskyFeedThreadgate.FollowingRule
    | AppBskyFeedThreadgate.ListRule
  )[] = []

  if (!threadgate.find(v => v.type === 'nobody')) {
    for (const rule of threadgate) {
      if (rule.type === 'mention') {
        allow.push({$type: 'app.bsky.feed.threadgate#mentionRule'})
      } else if (rule.type === 'following') {
        allow.push({$type: 'app.bsky.feed.threadgate#followingRule'})
      } else if (rule.type === 'list') {
        allow.push({
          $type: 'app.bsky.feed.threadgate#listRule',
          list: rule.list,
        })
      }
    }
  }

  return allow
}

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

export function createThreadgate({
  agent,
  postUri,
  threadgate,
}: {
  agent: BskyAgent
  postUri: string
  threadgate: Partial<AppBskyFeedThreadgate.Record>
}) {
  const urip = new AtUri(postUri)
  const record = {
    ...threadgate,
    post: postUri,
    createdAt: new Date().toISOString(),
  }

  return agent.api.app.bsky.feed.threadgate.create(
    {
      repo: urip.host,
      rkey: urip.rkey,
    },
    record,
  )
}
