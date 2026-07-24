import {useMemo} from 'react'
import {
  BSKY_LABELER_DID,
  type ModerationCause,
  type ModerationCauseSource,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useLabelDefinitions} from '#/state/preferences'
import {useSession} from '#/state/session'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {type AppModerationCause} from '#/components/Pills'
import {useGlobalLabelStrings} from './useGlobalLabelStrings'
import {getDefinition, getLabelStrings} from './useLabelInfo'

export interface ModerationCauseDescription {
  icon: React.ComponentType<SVGIconProps>
  name: string
  description: string
  source?: string
  sourceDisplayName?: string
  sourceType?: ModerationCauseSource['type']
  sourceAvi?: string
  sourceDid?: string
  isSubjectAccount?: boolean
}

export function useModerationCauseDescription(
  cause: ModerationCause | AppModerationCause | undefined,
): ModerationCauseDescription {
  const {currentAccount} = useSession()
  const {t: l, i18n} = useLingui()
  const {labelDefs, labelers} = useLabelDefinitions()
  const globalLabelStrings = useGlobalLabelStrings()

  return useMemo(() => {
    if (!cause) {
      return {
        icon: Warning,
        name: l`Content Warning`,
        description: l`Moderator has chosen to set a general warning on the content.`,
      }
    }
    if (cause.type === 'blocking') {
      if (cause.source.type === 'list') {
        return {
          icon: CircleBanSign,
          name: l`User Blocked by "${cause.source.list.name}"`,
          description: l`You have blocked this user. You cannot view their content.`,
        }
      } else {
        return {
          icon: CircleBanSign,
          name: l`User Blocked`,
          description: l`You have blocked this user. You cannot view their content.`,
        }
      }
    }
    if (cause.type === 'blocked-by') {
      return {
        icon: CircleBanSign,
        name: l`User Blocking You`,
        description: l`This user has blocked you. You cannot view their content.`,
      }
    }
    if (cause.type === 'block-other') {
      return {
        icon: CircleBanSign,
        name: l`Content Not Available`,
        description: l`This content is not available because one of the users involved has blocked the other.`,
      }
    }
    if (cause.type === 'muted') {
      if (cause.source.type === 'list') {
        return {
          icon: EyeSlash,
          name: l`Muted by "${cause.source.list.name}"`,
          description: l`You have muted this user`,
        }
      } else {
        return {
          icon: EyeSlash,
          name: l`Account Muted`,
          description: l`You have muted this account.`,
        }
      }
    }
    if (cause.type === 'mute-word') {
      return {
        icon: EyeSlash,
        name: l`Post Hidden by Muted Word`,
        description: l`You've chosen to hide a word or tag within this post.`,
      }
    }
    if (cause.type === 'hidden') {
      return {
        icon: EyeSlash,
        name: l`Post Hidden by You`,
        description: l`You have hidden this post`,
      }
    }
    if (cause.type === 'reply-hidden') {
      const isMe = currentAccount?.did === cause.source.did
      return {
        icon: EyeSlash,
        name: isMe ? l`Reply Hidden by You` : l`Reply Hidden by Thread Author`,
        description: isMe
          ? l`You hid this reply.`
          : l`The author of this thread has hidden this reply.`,
      }
    }
    if (cause.type === 'label') {
      const def = cause.labelDef || getDefinition(labelDefs, cause.label)
      const strings = getLabelStrings(i18n.locale, globalLabelStrings, def)
      const labeler = labelers.find(l => l.creator.did === cause.label.src)
      let source = labeler
        ? sanitizeHandle(labeler.creator.handle, '@')
        : undefined
      let sourceDisplayName = labeler?.creator.displayName
      if (!source) {
        if (cause.label.src === BSKY_LABELER_DID) {
          source = 'moderation.bsky.app'
          sourceDisplayName = 'Bluesky Moderation Service'
        } else {
          source = l`an unknown labeler`
        }
      }
      if (def.identifier === 'porn' || def.identifier === 'sexual') {
        strings.name = l`Adult Content`
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
        sourceDisplayName,
        sourceType: cause.source.type,
        sourceAvi: labeler?.creator.avatar,
        sourceDid: cause.label.src,
        isSubjectAccount: cause.label.uri.startsWith('did:'),
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
    l,
    i18n.locale,
    currentAccount?.did,
  ])
}
