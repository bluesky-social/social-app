import {moderatePost} from '@atproto/api'

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1] & {
  hiddenPosts?: string[]
}

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {hiddenPosts = [], ...options} = opts
  const moderations = moderatePost(subject, options)

  // TODO do something with hiddenPosts

  return moderations
}
