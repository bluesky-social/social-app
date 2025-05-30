import {
  type $Typed,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedDefs,
  AtUri,
  moderatePost,
  type ModerationOpts,
} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {
  type ThreadItem,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'

export function threadPostNoUnauthenticated({
  uri,
  depth,
  value,
}: AppBskyUnspeccedDefs.ThreadItem): Extract<
  ThreadItem,
  {type: 'threadPostNoUnauthenticated'}
> {
  return {
    type: 'threadPostNoUnauthenticated',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated,
  }
}

export function threadPostNotFound({
  uri,
  depth,
  value,
}: AppBskyUnspeccedDefs.ThreadItem): Extract<
  ThreadItem,
  {type: 'threadPostNotFound'}
> {
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
}: AppBskyUnspeccedDefs.ThreadItem): Extract<
  ThreadItem,
  {type: 'threadPostBlocked'}
> {
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
}: {
  uri: string
  depth: number
  value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  moderationOpts: ModerationOpts
}): Extract<ThreadItem, {type: 'threadPost'}> {
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
    moderation: moderatePost(value.post, moderationOpts),
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

export function postViewToThreadPlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<
  Omit<AppBskyUnspeccedDefs.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedDefs.ThreadItemPost>
  }
> {
  return {
    $type: 'app.bsky.unspecced.defs#threadItem',
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
