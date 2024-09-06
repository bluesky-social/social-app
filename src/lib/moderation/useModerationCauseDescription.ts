import React from 'react'
import {
  BSKY_LABELER_DID,
  ModerationCause,
  ModerationCauseSource,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useLabelDefinitions} from '#/state/preferences'
import {useSession} from '#/state/session'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Props as SVGIconProps} from '#/components/icons/common'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {AppModerationCause} from '#/components/Pills'
import {useGlobalLabelStrings} from './useGlobalLabelStrings'
import {getDefinition, getLabelStrings} from './useLabelInfo'

export interface ModerationCauseDescription {
  icon: React.ComponentType<SVGIconProps>
  name: string
  description: string
  source?: string
  sourceType?: ModerationCauseSource['type']
  sourceAvi?: string
  sourceDid?: string
}

export function useModerationCauseDescription(
  cause: ModerationCause | AppModerationCause | undefined,
): ModerationCauseDescription {
  const {currentAccount} = useSession()
  const {_, i18n} = useLingui()
  const {labelDefs, labelers} = useLabelDefinitions()
  const globalLabelStrings = useGlobalLabelStrings()

  return React.useMemo(() => {
    if (!cause) {
      return {
        icon: Warning,
        name: _(msg`Content Warning`),
        description: _(
          msg`Moderator has chosen to set a general warning on the content.`,
        ),
      }
    }
    if (cause.type === 'blocking') {
      if (cause.source.type === 'list') {
        return {
          icon: CircleBanSign,
          name: _(msg`User Blocked by "${cause.source.list.name}"`),
          description: _(
            msg`You have blocked this user. You cannot view their content.`,
          ),
        }
      } else {
        return {
          icon: CircleBanSign,
          name: _(msg`User Blocked`),
          description: _(
            msg`You have blocked this user. You cannot view their content.`,
          ),
        }
      }
    }
    if (cause.type === 'blocked-by') {
      return {
        icon: CircleBanSign,
        name: _(msg`User Blocking You`),
        description: _(
          msg`This user has blocked you. You cannot view their content.`,
        ),
      }
    }
    if (cause.type === 'block-other') {
      return {
        icon: CircleBanSign,
        name: _(msg`Content Not Available`),
        description: _(
          msg`This content is not available because one of the users involved has blocked the other.`,
        ),
      }
    }
    if (cause.type === 'muted') {
      if (cause.source.type === 'list') {
        return {
          icon: EyeSlash,
          name: _(msg`Muted by "${cause.source.list.name}"`),
          description: _(msg`You have muted this user`),
        }
      } else {
        return {
          icon: EyeSlash,
          name: _(msg`Account Muted`),
          description: _(msg`You have muted this account.`),
        }
      }
    }
    if (cause.type === 'mute-word') {
      return {
        icon: EyeSlash,
        name: _(msg`Post Hidden by Muted Word`),
        description: _(
          msg`You've chosen to hide a word or tag within this post.`,
        ),
      }
    }
    if (cause.type === 'hidden') {
      return {
        icon: EyeSlash,
        name: _(msg`Post Hidden by You`),
        description: _(msg`You have hidden this post`),
      }
    }
    if (cause.type === 'reply-hidden') {
      const isMe = currentAccount?.did === cause.source.did
      return {
        icon: EyeSlash,
        name: isMe
          ? _(msg`Reply Hidden by You`)
          : _(msg`Reply Hidden by Thread Author`),
        description: isMe
          ? _(msg`You hid this reply.`)
          : _(msg`The author of this thread has hidden this reply.`),
      }
    }
    if (cause.type === 'label') {
      const def = cause.labelDef || getDefinition(labelDefs, cause.label)
      const strings = getLabelStrings(i18n.locale, globalLabelStrings, def)
      const labeler = labelers.find(l => l.creator.did === cause.label.src)
      let source =
        labeler?.creator.displayName ||
        (labeler?.creator.handle ? '@' + labeler?.creator.handle : undefined)
      if (!source) {
        if (cause.label.src === BSKY_LABELER_DID) {
          source = 'Bluesky Moderation Service'
        } else {
          source = cause.label.src
        }
      }
      if (def.identifier === 'porn' || def.identifier === 'sexual') {
        strings.name = _(msg`Adult Content`)
      }

      return {
        icon:
          def.identifier === '!no-unauthenticated'
            ? EyeSlash
            : def.severity === 'alert'
            ? Warning
            : CircleInfo,
        name: strings.name,
        description: strings.description,
        source,
        sourceType: cause.source.type,
        sourceAvi: labeler?.creator.avatar,
        sourceDid: cause.label.src,
      }
    }
    // should never happen
    return {
      icon: CircleInfo,
      name: '',
      description: ``,
    }
  }, [
    labelDefs,
    labelers,
    globalLabelStrings,
    cause,
    _,
    i18n.locale,
    currentAccount?.did,
  ])
}
