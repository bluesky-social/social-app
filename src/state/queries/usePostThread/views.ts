import {
  type $Typed,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedGetPostThreadV2,
  AtUri,
  moderatePost,
  type ModerationOpts,
} from '@atproto/api'

import {type Slice} from '#/state/queries/usePostThread/types'

export function threadPostNoUnauthenticated({
  uri,
  depth,
  value,
}: AppBskyUnspeccedGetPostThreadV2.ThreadItem): Extract<
  Slice,
  {type: 'threadPostNoUnauthenticated'}
> {
  return {
    type: 'threadPostNoUnauthenticated',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedGetPostThreadV2.ThreadItemNoUnauthenticated,
  }
}

export function threadPostNotFound({
  uri,
  depth,
  value,
}: AppBskyUnspeccedGetPostThreadV2.ThreadItem): Extract<
  Slice,
  {type: 'threadPostNotFound'}
> {
  return {
    type: 'threadPostNotFound',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedGetPostThreadV2.ThreadItemNotFound,
  }
}

export function threadPostBlocked({
  uri,
  depth,
  value,
}: AppBskyUnspeccedGetPostThreadV2.ThreadItem): Extract<
  Slice,
  {type: 'threadPostBlocked'}
> {
  return {
    type: 'threadPostBlocked',
    key: uri,
    uri,
    depth,
    value: value as AppBskyUnspeccedGetPostThreadV2.ThreadItemBlocked,
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
  value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
  moderationOpts: ModerationOpts
}): Extract<Slice, {type: 'threadPost'}> {
  return {
    type: 'threadPost',
    key: uri,
    uri,
    depth,
    value: {
      ...value,
      /*
       * Do not spread anything here, load bearing for post shadow strict
       * equality checks.
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
  parent,
}: {
  parent: Extract<Slice, {type: 'threadPost'}>
}) {
  return {
    type: 'readMore' as const,
    key: `readMore:${parent.uri}`,
    indent: parent.ui.parentHasBranchingReplies
      ? parent.depth
      : parent.ui.indent,
    replyCount: parent.value.moreReplies,
    nextAnchor: parent,
    nextAnchorUri: new AtUri(parent.uri),
  }
}

export function postViewToThreadPlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<
  Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
  }
> {
  return {
    $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
    uri: post.uri,
    depth: 0, // reset to 0 for highlighted post
    value: {
      $type: 'app.bsky.unspecced.getPostThreadV2#threadItemPost',
      post,
      opThread: false,
      moreParents: false,
      moreReplies: 0,
    },
  }
}
