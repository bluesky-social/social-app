import {
  type $Typed,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  AtUri,
  moderatePost,
  type ModerationOpts,
} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {
  type ApiThreadItem,
  type ThreadItem,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'

export function threadPostNoUnauthenticated({
  uri,
  depth,
  value,
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostNoUnauthenticated'}> {
  return {
    type: 'threadPostNoUnauthenticated',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated,
    // @ts-ignore populated by the traversal
    ui: {},
  }
}

export function threadPostNotFound({
  uri,
  depth,
  value,
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostNotFound'}> {
  return {
    type: 'threadPostNotFound',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemNotFound,
  }
}

export function threadPostBlocked({
  uri,
  depth,
  value,
}: ApiThreadItem): Extract<ThreadItem, {type: 'threadPostBlocked'}> {
  return {
    type: 'threadPostBlocked',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemBlocked,
  }
}

export function threadPost({
  uri,
  depth,
  value,
  moderationOpts,
  threadgateHiddenReplies,
}: {
  uri: string
  depth: number
  value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  moderationOpts: ModerationOpts
  threadgateHiddenReplies: Set<string>
}): Extract<ThreadItem, {type: 'threadPost'}> {
  const moderation = moderatePost(value.post, moderationOpts)
  const modui = moderation.ui('contentList')
  const blurred = modui.blur || modui.filter
  const muted = (modui.blurs[0] || modui.filters[0])?.type === 'muted'
  const hiddenByThreadgate = threadgateHiddenReplies.has(uri)
  const isBlurred = hiddenByThreadgate || blurred || muted
  return {
    type: 'threadPost',
    key: uri,
    uri,
    depth,
    value: {
      ...value,
      /*
       * Do not spread anything here, load bearing for post shadow strict
       * equality reference checks.
       */
      post: value.post as Omit<AppBskyFeedDefs.PostView, 'record'> & {
        record: AppBskyFeedPost.Record
      },
    },
    isBlurred,
    moderation,
    // @ts-ignore populated by the traversal
    ui: {},
  }
}

export function readMore({
  depth,
  repliesUnhydrated,
  skippedIndentIndices,
  postData,
}: TraversalMetadata): Extract<ThreadItem, {type: 'readMore'}> {
  const urip = new AtUri(postData.uri)
  const href = makeProfileLink(
    {
      did: urip.host,
      handle: postData.authorHandle,
    },
    'post',
    urip.rkey,
  )
  return {
    type: 'readMore' as const,
    key: `readMore:${postData.uri}`,
    href,
    moreReplies: repliesUnhydrated,
    depth,
    skippedIndentIndices,
  }
}

export function readMoreUp({
  postData,
}: TraversalMetadata): Extract<ThreadItem, {type: 'readMoreUp'}> {
  const urip = new AtUri(postData.uri)
  const href = makeProfileLink(
    {
      did: urip.host,
      handle: postData.authorHandle,
    },
    'post',
    urip.rkey,
  )
  return {
    type: 'readMoreUp' as const,
    key: `readMoreUp:${postData.uri}`,
    href,
  }
}

export function skeleton({
  key,
  item,
}: Omit<Extract<ThreadItem, {type: 'skeleton'}>, 'type'>): Extract<
  ThreadItem,
  {type: 'skeleton'}
> {
  return {
    type: 'skeleton',
    key,
    item,
  }
}

export function postViewToThreadPlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<
  Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  }
> {
  return {
    $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
    uri: post.uri,
    depth: 0, // reset to 0 for highlighted post
    value: {
      $type: 'app.bsky.unspecced.defs#threadItemPost',
      post,
      opThread: false,
      moreParents: false,
      moreReplies: 0,
      hiddenByThreadgate: false,
      mutedByViewer: false,
    },
  }
}
