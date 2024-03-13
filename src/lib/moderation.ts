import {ModerationCause, ProfileModeration, PostModeration} from '@atproto/api'

export interface ModerationCauseDescription {
  name: string
  description: string
}

export function describeModerationCause(
  cause: ModerationCause | undefined,
  context: 'account' | 'content',
): ModerationCauseDescription {
  if (!cause) {
    return {
      name: 'Content Warning',
      description:
        'Moderator has chosen to set a general warning on the content.',
    }
  }
  if (cause.type === 'blocking') {
    if (cause.source.type === 'list') {
      return {
        name: `User Blocked by "${cause.source.list.name}"`,
        description:
          'You have blocked this user. You cannot view their content.',
      }
    } else {
      return {
        name: 'User Blocked',
        description:
          'You have blocked this user. You cannot view their content.',
      }
    }
  }
  if (cause.type === 'blocked-by') {
    return {
      name: 'User Blocking You',
      description: 'This user has blocked you. You cannot view their content.',
    }
  }
  if (cause.type === 'block-other') {
    return {
      name: 'Content Not Available',
      description:
        'This content is not available because one of the users involved has blocked the other.',
    }
  }
  if (cause.type === 'muted') {
    if (cause.source.type === 'list') {
      return {
        name:
          context === 'account'
            ? `Muted by "${cause.source.list.name}"`
            : `Post by muted user ("${cause.source.list.name}")`,
        description: 'You have muted this user',
      }
    } else {
      return {
        name: context === 'account' ? 'Muted User' : 'Post by muted user',
        description: 'You have muted this user',
      }
    }
  }
  // @ts-ignore Temporary extension to the moderation system -prf
  if (cause.type === 'post-hidden') {
    return {
      name: 'Post Hidden by You',
      description: 'You have hidden this post',
    }
  }
  // @ts-ignore Temporary extension to the moderation system -prf
  if (cause.type === 'muted-word') {
    return {
      name: 'Post hidden by muted word',
      description: `You've chosen to hide a word or tag within this post.`,
    }
  }
  return cause.labelDef.strings[context].en
}

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
