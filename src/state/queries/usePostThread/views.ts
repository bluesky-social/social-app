import {
  type $Typed,
  type AppBskyEmbedRecord,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  moderatePost,
  type ModerationOpts,
} from '@atproto/api'

import {type Slice} from '#/state/queries/usePostThread/types'
import {embedViewRecordToPostView} from '#/state/queries/util'

export function noUnauthenticated({
  item,
}: {
  item: AppBskyUnspeccedDefs.ThreadItemNoUnauthenticated
}): Extract<Slice, {type: 'threadSliceNoUnauthenticated'}> {
  return {
    type: 'threadSliceNoUnauthenticated',
    key: item.uri,
    slice: item,
  }
}

export function notFound({
  item,
}: {
  item: AppBskyUnspeccedDefs.ThreadItemNotFound
}): Extract<Slice, {type: 'threadSliceNotFound'}> {
  return {
    type: 'threadSliceNotFound',
    key: item.uri,
    slice: item,
  }
}

export function blocked({
  item,
}: {
  item: AppBskyUnspeccedDefs.ThreadItemBlocked
}): Extract<Slice, {type: 'threadSliceBlocked'}> {
  return {
    type: 'threadSliceBlocked',
    key: item.uri,
    slice: item,
  }
}

export function post({
  item,
  oneUp,
  oneDown,
  moderationOpts,
}: {
  item: AppBskyUnspeccedDefs.ThreadItemPost
  oneUp?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  oneDown?: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'][number]
  moderationOpts: ModerationOpts
}): Extract<Slice, {type: 'threadSlice'}> {
  return {
    type: 'threadSlice',
    key: item.uri,
    slice: {
      ...item,
      post: {
        ...item.post,
        record: item.post.record as AppBskyFeedPost.Record,
      },
    },
    moderation: moderatePost(item.post, moderationOpts),
    ui: {
      isAnchor: item.depth === 0,
      showParentReplyLine:
        !!oneUp && 'depth' in oneUp && oneUp.depth < item.depth,
      showChildReplyLine:
        !!oneDown && 'depth' in oneDown && oneDown.depth > item.depth,
    },
  }
}

export function postViewToThreadPlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<AppBskyUnspeccedDefs.ThreadItemPost> {
  return {
    $type: 'app.bsky.unspecced.defs#threadItemPost',
    uri: post.uri,
    post,
    depth: 0, // reset to 0 for highlighted post
    isOPThread: false, // unknown
    hasOPLike: false, // unknown
    hasUnhydratedReplies: false, // unknown
    // TODO test
    hasUnhydratedParents: !!(post.record as AppBskyFeedPost.Record).reply, // unknown
  }
}

export function embedViewToThreadPlaceholder(
  record: AppBskyEmbedRecord.ViewRecord,
): $Typed<AppBskyUnspeccedDefs.ThreadItemPost> {
  return {
    $type: 'app.bsky.unspecced.defs#threadItemPost',
    uri: record.uri,
    post: embedViewRecordToPostView(record),
    depth: 0, // reset to 0 for highlighted post
    isOPThread: false, // unknown
    hasOPLike: false, // unknown
    hasUnhydratedReplies: false, // unknown
    // TODO test
    hasUnhydratedParents: !!(record.value as AppBskyFeedPost.Record).reply, // unknown
  }
}
