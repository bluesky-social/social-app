/* eslint-disable-next-line no-restricted-imports */
import {BSKY_LABELER_DID, moderatePost} from '@atproto/api'

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1]

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  // HACK
  // temporarily translate 'gore' into 'graphic-media' during the transition period
  // can remove this in a few months
  // -prf
  translateOldLabels(subject)

  return moderatePost(subject, opts)
}

function translateOldLabels(subject: Parameters<ModeratePost>[0]) {
  if (subject.labels) {
    for (const label of subject.labels) {
      if (
        label.val === 'gore' &&
        (!label.src || label.src === BSKY_LABELER_DID)
      ) {
        label.val = 'graphic-media'
      }
    }
  }
}
