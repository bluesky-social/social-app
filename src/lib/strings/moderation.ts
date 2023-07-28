import {ModerationCause} from '@atproto/api'

export interface ModerationCauseDescription {
  name: string
  description: string
}

export function describeModerationCause(
  cause: ModerationCause | undefined,
  context: 'account' | 'content' = 'content',
): ModerationCauseDescription {
  if (!cause) {
    return {
      name: 'Content Warning',
      description:
        'Moderator has chosen to set a general warning on the content.',
    }
  }
  if (cause.type === 'blocking') {
    return {
      name: 'Blocked User',
      description: 'You have blocked this user. You cannot view their content.',
    }
  }
  if (cause.type === 'blocked-by') {
    return {
      name: 'Blocking You',
      description: 'This user has blocked you. You cannot view their content.',
    }
  }
  if (cause.type === 'muted') {
    if (cause.source.type === 'user') {
      return {
        name: 'Muted User',
        description: 'You have muted this user',
      }
    } else {
      return {
        name: `Muted by "${cause.source.list.name}"`,
        description: 'You have muted this user',
      }
    }
  }
  return cause.labelDef.strings[context].en
}
