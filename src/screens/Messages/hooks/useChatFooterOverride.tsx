import {useMemo} from 'react'
import {moderateProfile} from '@atproto/api'

import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {ChatDisabled} from '#/screens/Messages/components/ChatDisabled'
import {ChatEnded} from '#/screens/Messages/components/ChatEnded'
import {ChatLocked} from '#/screens/Messages/components/ChatLocked'
import {MessagesListBlockedFooter} from '#/components/dms/MessagesListBlockedFooter'
import {type ConvoWithDetails} from '#/components/dms/util'

/**
 * Returns a footer node to render in place of the composer when the chat
 * can't accept new messages (disabled, blocked, locked, ended) — or `null` to
 * let the composer render normally.
 */
export function useChatFooterOverride({
  convo,
  isDisabled,
  hasMessages,
}: {
  convo: ConvoWithDetails | null
  isDisabled: boolean
  hasMessages: boolean
}): React.ReactNode {
  const primaryMember = useMaybeProfileShadow(convo?.primaryMember)
  const moderationOpts = useModerationOpts()
  const primaryMemberModeration = useMemo(() => {
    if (!primaryMember || !moderationOpts) return null
    return moderateProfile(primaryMember, moderationOpts)
  }, [primaryMember, moderationOpts])

  if (isDisabled) {
    return <ChatDisabled />
  }
  if (convo && primaryMember && primaryMemberModeration?.blocked) {
    return (
      <MessagesListBlockedFooter
        recipient={primaryMember}
        convoId={convo.view.id}
        hasMessages={hasMessages}
        moderation={primaryMemberModeration}
      />
    )
  }
  if (convo?.kind === 'group') {
    if (convo.details.lockStatus === 'locked') {
      return <ChatLocked convo={convo} />
    }
    if (convo.details.lockStatus === 'locked-permanently') {
      return <ChatEnded convo={convo} />
    }
  }
  return null
}
