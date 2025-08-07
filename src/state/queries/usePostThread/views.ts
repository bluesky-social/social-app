import {
  type $Typed,
  type AppGndrFeedDefs,
  type AppGndrFeedPost,
  type AppGndrUnspeccedDefs,
  type AppGndrUnspeccedGetPostThreadV2,
  AtUri,
  moderatePost,
  type ModerationOpts,
} from '@gander-social-atproto/api'

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
    value: value as AppGndrUnspeccedDefs.ThreadItemNoUnauthenticated,
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
    value: value as AppGndrUnspeccedDefs.ThreadItemNotFound,
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
    value: value as AppGndrUnspeccedDefs.ThreadItemBlocked,
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
  value: $Typed<AppGndrUnspeccedDefs.ThreadItemPost>
  moderationOpts: ModerationOpts
  threadgateHiddenReplies: Set<string>
}): Extract<ThreadItem, {type: 'threadPost'}> {
  const moderation = moderatePost(value.post, moderationOpts)
  const modui = moderation.ui('contentList')
  const blurred = modui.blur || modui.filter
  const muted = (modui.blurs[0] || modui.filters[0])?.type === 'muted'
  const hiddenByThreadgate = threadgateHiddenReplies.has(uri)
  const isOwnPost = value.post.author.did === moderationOpts.userDid
  const isBlurred = (hiddenByThreadgate || blurred || muted) && !isOwnPost
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
      post: value.post as Omit<AppGndrFeedDefs.PostView, 'record'> & {
        record: AppGndrFeedPost.Record
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
  post: AppGndrFeedDefs.PostView,
): $Typed<
  Omit<AppGndrUnspeccedGetPostThreadV2.ThreadItem, 'value'> & {
    value: $Typed<AppGndrUnspeccedDefs.ThreadItemPost>
  }
> {
  return {
    $type: 'app.gndr.unspecced.getPostThreadV2#threadItem',
    uri: post.uri,
    depth: 0, // reset to 0 for highlighted post
    value: {
      $type: 'app.gndr.unspecced.defs#threadItemPost',
      post,
      opThread: false,
      moreParents: false,
      moreReplies: 0,
      hiddenByThreadgate: false,
      mutedByViewer: false,
    },
  }
}
