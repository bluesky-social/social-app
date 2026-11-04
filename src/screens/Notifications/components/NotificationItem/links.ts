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
