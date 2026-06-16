import {createContext, useContext} from 'react'

import {type ChatInvitePreview} from '#/state/queries/join-links'
import {type ButtonColor} from '#/components/Button'
import {type Props as SVGIconProps} from '#/components/icons/common'

/**
 * The derived state of the join/open action for a chat invite, computed once in
 * `Root` and consumed by `JoinButton` (or any custom action UI).
 */
export type ChatInviteAction = {
  label: string
  accessibilityHint: string
  icon: React.ComponentType<SVGIconProps>
  color: ButtonColor
  /**
   * Whether the action can be performed. False when the link is disabled, the
   * chat is full, or the viewer doesn't meet the join rule.
   */
  disabled: boolean
  onPress: () => void
  side: 'left' | 'right'
}

/**
 * The resolved state of a chat invite:
 * - `loading`: the preview is still being fetched.
 * - `error`: the fetch failed (e.g. network). Surfaces may want to fall back to
 *   a plain link rather than show a chat-specific error.
 * - `unavailable`: the preview resolved but the link is disabled, invalid, or an
 *   unrecognized variant - there's nothing to join.
 * - `available`: a usable `JoinLinkPreviewView` is present.
 */
export type ChatInviteStatus = 'loading' | 'error' | 'unavailable' | 'available'

export type ChatInviteContextValue = {
  code: string
  status: ChatInviteStatus
  preview: ChatInvitePreview | undefined
  /**
   * The derived action descriptor. Undefined while loading or when there's no
   * preview to act on.
   */
  action: ChatInviteAction | undefined
  /** Whether the invite is rendered inside a fixed-height container; when true, text inside disables font scaling so the card doesn't overflow. */
  hasFixedHeight: boolean
}

const ChatInviteContext = createContext<ChatInviteContextValue | null>(null)

export function useChatInvite(): ChatInviteContextValue {
  const ctx = useContext(ChatInviteContext)
  if (!ctx) {
    throw new Error('useChatInvite must be used within a ChatInvite.Root')
  }
  return ctx
}

export const ChatInviteProvider = ChatInviteContext.Provider
