/* eslint-disable no-restricted-imports */
import {
  BSKY_LABELER_DID,
  moderatePost as defaultModeratePost,
} from '@atproto/api'

type ModeratePost = typeof defaultModeratePost
export type Subject = Parameters<ModeratePost>[0]
export type Options = Parameters<ModeratePost>[1]

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

export function moderatePost(post: Subject, opts: Options) {
  // HACK
  // temporarily translate 'gore' into 'graphic-media' during the transition period
  // can remove this in a few months
  // -prf
  translateOldLabels(post)

  return defaultModeratePost(post, opts)
}
