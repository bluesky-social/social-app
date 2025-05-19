import {
  type $Typed,
  type AppBskyEmbedRecord,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedGetPostThreadV2,
  moderatePost,
  type ModerationOpts,
} from '@atproto/api'

import {type Slice} from '#/state/queries/usePostThread/types'
import {embedViewRecordToPostView} from '#/state/queries/util'

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
  oneUp,
  oneDown,
  moderationOpts,
}: {
  uri: string
  depth: number
  value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
  oneUp?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  oneDown?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  moderationOpts: ModerationOpts
}): Extract<Slice, {type: 'threadPost'}> {
  return {
    type: 'threadPost',
    key: uri,
    uri,
    depth,
    value: {
      ...value,
      post: {
        ...value.post,
        record: value.post.record as AppBskyFeedPost.Record,
      },
    },
    moderation: moderatePost(value.post, moderationOpts),
    ui: {
      isAnchor: depth === 0,
      showParentReplyLine: !!oneUp && oneUp.depth < depth,
      showChildReplyLine: !!oneDown && oneDown.depth > depth,
    },
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
      isOPThread: false, // unknown
      hasOPLike: false, // unknown
      // @ts-expect-error
      hasUnhydratedReplies: false, // unknown
      // TODO test
      hasUnhydratedParents: !!(post.record as AppBskyFeedPost.Record).reply, // unknown
    },
  }
}

export function embedViewToThreadPlaceholder(
  record: AppBskyEmbedRecord.ViewRecord,
): $Typed<
  Omit<AppBskyUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppBskyUnspeccedGetPostThreadV2.ThreadItemPost>
  }
> {
  return {
    $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
    uri: record.uri,
    depth: 0, // reset to 0 for highlighted post
    value: {
      $type: 'app.bsky.unspecced.getPostThreadV2#threadItemPost',
      post: embedViewRecordToPostView(record),
      isOPThread: false, // unknown
      hasOPLike: false, // unknown
      // @ts-expect-error
      hasUnhydratedReplies: false, // unknown
      // TODO test
      hasUnhydratedParents: !!(record.value as AppBskyFeedPost.Record).reply, // unknown
    },
  }
}
