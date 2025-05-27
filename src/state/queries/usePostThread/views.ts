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
  parent: up,
  oneUp,
  moderationOpts,
}: {
  uri: string
  depth: number
  value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
  parent?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  oneUp?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  oneDown?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  moderationOpts: ModerationOpts
}): Extract<Slice, {type: 'threadPost'}> {
  const parent = (up && 'post' in up?.value
    ? up.value
    : undefined) as unknown as AppBskyUnspeccedGetPostThreadV2.ThreadItemPost
  const parentReplyCount = parent?.post?.replyCount || 0
  const parentAdditionalReplies = parent?.moreReplies || 0
  const parentHasBranchingReplies =
    parentReplyCount > 1 && parentReplyCount - parentAdditionalReplies > 1
  // if (!parentHasBranchingReplies) {
  //   console.log(value.post.record.text, {
  //     parentReplyCount,
  //     parentAdditionalReplies,
  //   })
  // }

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
    ui: {
      isAnchor: depth === 0,
      showParentReplyLine: !!oneUp && oneUp.depth !== 0 && oneUp.depth < depth,
      showChildReplyLine: (value.post.replyCount || 0) > 0,
      indent: parentHasBranchingReplies ? depth : up?.depth || depth,
      parentHasBranchingReplies,
    },
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
      : parent.depth - 1,
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
      hiddenByThreadgate: false,
      opThread: false,
      moreParents: false,
      moreReplies: 0,
      mutedByViewer: false,
    },
  }
}
