import {AtUri} from '@atproto/syntax'

import {makeProfileLink} from '#/lib/routes/links'

/**
 * Link to a post, optionally to a sub-route like `liked-by`. Takes a post
 * view or the record view of a quoted post.
 */
export function makePostLink(
  post: {uri: string; author: {did: string; handle: string}},
  ...segments: string[]
) {
  return makeProfileLink(
    post.author,
    'post',
    new AtUri(post.uri).rkey,
    ...segments,
  )
}

/**
 * The most posts an activity list link carries. The load balancer in front of
 * bsky.app rejects paths over 16 KiB with a 414, which a full page load on web
 * would hit at about 188 encoded post at-uris. This leaves room for longer
 * DIDs, like `did:web`s.
 */
export const MAX_ACTIVITY_LIST_POSTS = 150

/**
 * Link to the activity list screen, which shows the given posts as a feed.
 * Only the first `MAX_ACTIVITY_LIST_POSTS` are included.
 */
export function makeActivityListLink(uris: string[]) {
  const posts = uris.slice(0, MAX_ACTIVITY_LIST_POSTS).join(',')
  return `/notifications/activity?posts=${encodeURIComponent(posts)}`
}
