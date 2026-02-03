import React from 'react'
import {type ChatBskyConvoDefs, ModerationUI} from '@atproto/api'

import {
  useDmImageAlwaysBlur,
  useDmImageBlurFromNonFollows,
} from '#/state/preferences'
import {useSession} from '#/state/session'
import {ContentHider} from '#/components/moderation/ContentHider'

/**
 * DMImageContentHider - Wrapper component for blurring DM images with user preferences
 *
 * This component provides privacy-focused image blurring for Direct Messages with a
 * forward-compatible design that seamlessly integrates with future backend moderation.
 *
 * ARCHITECTURE:
 * -------------
 * The component uses a priority system that ensures smooth transition from user preferences
 * to platform moderation:
 *
 * 1. Backend Moderation (highest priority, future)
 *    - When AT Protocol adds optional `moderation` field to MessageView
 *    - Platform-level content filtering based on user's existing Content Filter preferences
 *    - Automatically takes precedence over user preferences
 *
 * 2. User Preferences (current implementation)
 *    - dmImageAlwaysBlur: Blur all images in DMs
 *    - dmImageBlurFromNonFollows: Blur images from accounts the user doesn't follow
 *    - Stored in persisted state, managed via React Context
 *
 * 3. No Blur (default)
 *    - Images from yourself are never blurred
 *    - Images that don't match any blur criteria render directly
 *
 * FUTURE INTEGRATION:
 * -------------------
 * When backend moderation becomes available:
 *
 * 1. AT Protocol adds: ChatBskyConvoDefs.MessageView.moderation?: ModerationUI
 * 2. In MessageItem.tsx, call: moderateMessage(message, moderationOpts)
 * 3. Pass resulting ModerationUI to MessageItemEmbed as new prop
 * 4. DMImageContentHider receives it via `moderation` prop
 * 5. No other code changes needed - the conditional logic handles the rest
 *
 * This means user preferences become a fallback when backend moderation is unavailable,
 * and Content Filter settings (porn, nudity, etc.) will automatically apply to DMs.
 *
 * SYNTHETIC MODERATION:
 * ---------------------
 * When user preferences trigger a blur, we create a synthetic ModerationUI object
 * with label 'dm-user-blur' to maintain compatibility with the existing ContentHider
 * component. This allows us to reuse all ContentHider UI/UX without duplication.
 */
export function DMImageContentHider({
  message,
  convo,
  moderation,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  convo: ChatBskyConvoDefs.ConvoView
  moderation?: ModerationUI // Future: from moderateMessage(message, moderationOpts)
  children: React.ReactNode
}) {
  const {currentAccount} = useSession()
  const alwaysBlur = useDmImageAlwaysBlur()
  const blurFromNonFollows = useDmImageBlurFromNonFollows()

  const currentUserDid = currentAccount?.did

  // Edge case: If message has no sender (shouldn't happen), render without blur
  if (!message.sender) {
    return <>{children}</>
  }

  // NEVER blur your own images - this takes precedence over all preferences
  if (currentUserDid && message.sender.did === currentUserDid) {
    return <>{children}</>
  }

  // PRIORITY 1: Backend moderation (when available)
  // If the message includes platform-level moderation data, use it directly.
  // This allows Content Filter preferences to automatically apply to DMs.
  if (moderation) {
    return (
      <ContentHider testID="dm-image-content-hider" modui={moderation}>
        {children}
      </ContentHider>
    )
  }

  // PRIORITY 2: User preferences (current implementation)
  // Check if user has enabled any DM-specific blur preferences
  let shouldBlur = false

  if (alwaysBlur) {
    // User wants all DM images blurred
    shouldBlur = true
  } else if (blurFromNonFollows) {
    // User wants images blurred from accounts they don't follow
    // Find the sender in the conversation members list
    const sender = convo.members.find(
      member => member.did === message.sender?.did,
    )
    // Blur if: sender not found in members OR user is not following the sender
    // Note: viewer.following is truthy when the current user follows this account
    if (!sender || !sender.viewer?.following) {
      shouldBlur = true
    }
  }

  // If no blur criteria matched, render children directly
  if (!shouldBlur) {
    return <>{children}</>
  }

  // Create synthetic ModerationUI for user preference-based blur
  // This mimics the structure of backend moderation to work with ContentHider
  // We use 'hidden' type which is simpler than 'label' and appropriate for user preferences
  const syntheticModui = new ModerationUI()
  syntheticModui.blurs = [
    {
      type: 'hidden',
      source: {type: 'user'},
      priority: 6,
    },
  ]

  return (
    <ContentHider testID="dm-image-content-hider" modui={syntheticModui}>
      {children}
    </ContentHider>
  )
}
