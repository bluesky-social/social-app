import {ModerationCause, ProfileModeration, PostModeration} from '@atproto/api'

export function getProfileModerationCauses(
  moderation: ProfileModeration,
): ModerationCause[] {
  /*
  Gather everything on profile and account that blurs or alerts
  */
  return [
    moderation.decisions.profile.cause,
    ...moderation.decisions.profile.additionalCauses,
    moderation.decisions.account.cause,
    ...moderation.decisions.account.additionalCauses,
  ].filter(cause => {
    if (!cause) {
      return false
    }
    if (cause?.type === 'label') {
      if (
        cause.labelDef.onwarn === 'blur' ||
        cause.labelDef.onwarn === 'alert'
      ) {
        return true
      } else {
        return false
      }
    }
    return true
  }) as ModerationCause[]
}

export function isPostMediaBlurred(
  decisions: PostModeration['decisions'],
): boolean {
  return decisions.post.blurMedia
}

export function isQuoteBlurred(
  decisions: PostModeration['decisions'],
): boolean {
  return (
    decisions.quote?.blur ||
    decisions.quote?.blurMedia ||
    decisions.quote?.filter ||
    decisions.quotedAccount?.blur ||
    decisions.quotedAccount?.filter ||
    false
  )
}

export function isCauseALabelOnUri(
  cause: ModerationCause | undefined,
  uri: string,
): boolean {
  if (cause?.type !== 'label') {
    return false
  }
  return cause.label.uri === uri
}

export function getModerationCauseKey(cause: ModerationCause): string {
  const source =
    cause.source.type === 'labeler'
      ? cause.source.labeler.did
      : cause.source.type === 'list'
      ? cause.source.list.uri
      : 'user'
  if (cause.type === 'label') {
    return `label:${cause.label.val}:${source}`
  }
  return `${cause.type}:${source}`
}
