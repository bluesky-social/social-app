import {moderatePost} from '@atproto/api'

// TODO
// do we think we'll need this again?
// if not we can ditch it!
// -prf

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1]

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  return moderatePost(subject, opts)
}
