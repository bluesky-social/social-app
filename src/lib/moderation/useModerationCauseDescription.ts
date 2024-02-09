import {ModerationCause} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useLabelStrings} from './useLabelStrings'

export interface ModerationCauseDescription {
  name: string
  description: string
}

export function useModerationCauseDescription(
  cause: ModerationCause | undefined,
  context: 'account' | 'content',
): ModerationCauseDescription {
  const {_} = useLingui()
  const labelStrings = useLabelStrings()
  if (!cause) {
    return {
      name: _(msg`Content Warning`),
      description: _(
        msg`Moderator has chosen to set a general warning on the content.`,
      ),
    }
  }
  if (cause.type === 'blocking') {
    if (cause.source.type === 'list') {
      return {
        name: _(msg`User Blocked by "${cause.source.list.name}"`),
        description: _(
          msg`You have blocked this user. You cannot view their content.`,
        ),
      }
    } else {
      return {
        name: _(msg`User Blocked`),
        description: _(
          msg`You have blocked this user. You cannot view their content.`,
        ),
      }
    }
  }
  if (cause.type === 'blocked-by') {
    return {
      name: _(msg`User Blocking You`),
      description: _(
        msg`This user has blocked you. You cannot view their content.`,
      ),
    }
  }
  if (cause.type === 'block-other') {
    return {
      name: _(msg`Content Not Available`),
      description: _(
        msg`This content is not available because one of the users involved has blocked the other.`,
      ),
    }
  }
  if (cause.type === 'muted') {
    if (cause.source.type === 'list') {
      return {
        name:
          context === 'account'
            ? _(msg`Muted by "${cause.source.list.name}"`)
            : _(msg`Post by muted user ("${cause.source.list.name}")`),
        description: _(msg`You have muted this user`),
      }
    } else {
      return {
        name:
          context === 'account'
            ? _(msg`Muted User`)
            : _(msg`Post by muted user`),
        description: _(msg`You have muted this user`),
      }
    }
  }
  // @ts-ignore Temporary extension to the moderation system -prf
  if (cause.type === 'post-hidden') {
    return {
      name: _(msg`Post Hidden by You`),
      description: _(msg`You have hidden this post`),
    }
  }
  if (cause.type === 'label') {
    if (cause.labelDef.id in labelStrings) {
      const strings = labelStrings[cause.labelDef.id]
      return {
        name:
          context === 'account' ? strings.account.name : strings.content.name,
        description:
          context === 'account'
            ? strings.account.description
            : strings.content.description,
      }
    }
    return {
      name: cause.labelDef.id,
      description: _(msg`Labeled ${cause.labelDef.id}`),
    }
  }
  // should never happen
  return {
    name: '',
    description: ``,
  }
}
