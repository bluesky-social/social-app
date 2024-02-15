import {moderatePost} from '@atproto/api'

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1] & {
  hiddenPosts?: string[]
}

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  const moderation = moderatePost(subject, opts)
  moderation.addHidden(opts.hiddenPosts?.includes(subject.uri) || false)
  return moderation
}
