import {setStringAsync} from 'expo-clipboard'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {
  type ChatInvitePreview,
  useJoinLinkPreviewsQuery,
} from '#/state/queries/join-links'
import {useSession} from '#/state/session'
import {type ButtonColor} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon} from '#/components/icons/ArrowBoxRight'
import {ChainLink_Stroke2_Corner0_Rounded as LinkIcon} from '#/components/icons/ChainLink'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import * as Toast from '#/components/Toast'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  type ChatInviteAction,
  ChatInviteProvider,
  type ChatInviteStatus,
} from './Context'

/**
 * Headless data + state owner for a chat invite. Fetches the join link preview
 * by code and derives the join/open action, exposing both via context for the
 * composable parts (`Card`, `JoinButton`) or any custom UI to consume.
 *
 * Pass `initialPreview` when the preview is already known (e.g. a DM message
 * embed already carries the resolved view) to avoid a loading flash.
 */
export function Root({
  code,
  initialPreview,
  currentConvoId,
  hasFixedHeight,
  children,
}: {
  code: string
  initialPreview?: ChatInvitePreview
  /**
   * The convo this invite is being viewed within, if any. When the invite
   * links to the same chat, the action becomes "Copy link" instead of
   * open/join (you're already here).
   */
  currentConvoId?: string
  hasFixedHeight: boolean
  children: React.ReactNode
}) {
  const {hasSession} = useSession()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {groupChatJoinDialogControl, setGroupChatJoinState} = useIntentDialogs()

  const {data, error, isPending} = useJoinLinkPreviewsQuery({
    codes: [code],
    hasSession,
    // Seed the cache with the already-resolved preview so we don't refetch.
    initialData: initialPreview
      ? {joinLinkPreviews: [initialPreview]}
      : undefined,
  })

  const preview = data?.joinLinkPreviews[0]

  let status: ChatInviteStatus
  if (isPending && !preview) {
    status = 'loading'
  } else if (error) {
    status = 'error'
  } else if (bsky.isType(chat.bsky.group.defs.joinLinkPreviewView, preview)) {
    status = 'available'
  } else {
    // Resolved to a disabled/invalid/unrecognized preview - nothing to join.
    status = 'unavailable'
  }

  let action: ChatInviteAction | undefined
  if (bsky.isType(chat.bsky.group.defs.joinLinkPreviewView, preview)) {
    const convoId = preview.convo?.id
    const isFollowing = preview.owner.viewer?.followedBy ?? false
    const hasRequested = !convoId && preview.viewer?.requestedAt != null

    if (convoId && convoId === currentConvoId) {
      // You're already in the chat this invite links to - offer to copy the
      // link rather than open/join.
      action = {
        label: l`Copy link`,
        accessibilityHint: l`Tap to copy this invite link`,
        icon: LinkIcon,
        side: 'left',
        color: 'primary',
        disabled: false,
        onPress: () => {
          void setStringAsync(`https://bsky.app/chat/${preview.code}`)
          Toast.show(l`Copied to clipboard`, {type: 'success'})
        },
      }
    } else if (convoId) {
      action = {
        label: l`Open chat`,
        accessibilityHint: l`Tap to open this group chat`,
        icon: ArrowRightIcon,
        side: 'right',
        color: 'primary',
        disabled: false,
        onPress: () => {
          navigation.push('MessagesConversation', {conversation: convoId})
        },
      }
    } else {
      let canJoin = true
      let icon: React.ComponentType<SVGIconProps> = JoinIcon
      let label = preview.requireApproval ? l`Request to join` : l`Join`
      let color: ButtonColor = 'primary'
      if (preview.memberCount >= preview.memberLimit) {
        canJoin = false
        icon = HandIcon
        label = l`This chat is full`
        color = 'secondary'
      } else if (preview.joinRule === 'followedByOwner' && !isFollowing) {
        canJoin = false
        icon = HandIcon
        label = l`Only people the chat owner follows can join`
        color = 'secondary'
      } else if (hasRequested) {
        icon = CheckIcon
        label = l`Requested`
        color = 'secondary'
      }

      action = {
        label,
        side: 'left',
        accessibilityHint: preview.requireApproval
          ? l`Tap to request access to join this group chat`
          : l`Tap to join this group chat immediately`,
        icon,
        color,
        disabled: !canJoin,
        onPress: () => {
          setGroupChatJoinState({code: preview.code})
          groupChatJoinDialogControl.open()
        },
      }
    }
  }

  return (
    <ChatInviteProvider value={{code, status, preview, action, hasFixedHeight}}>
      {children}
    </ChatInviteProvider>
  )
}
