import React from 'react'
import {type ChatBskyConvoDefs, type ModerationUI} from '@atproto/api'

import {useSession} from '#/state/session'
import {ContentHider} from '#/components/moderation/ContentHider'
import {useModerationDecision} from './moderation/useModerationDecision'

/**
 * DMImageContentHider - Privacy-focused image blur for Direct Messages
 *
 * DESIGN PHILOSOPHY:
 * ------------------
 * This component addresses the immediate user need for DM image privacy while
 * the AT Protocol team designs the "permissioned data" infrastructure needed
 * for platform-level moderation (ref: bnewbold's comment on operational security,
 * abuse prevention, and administrative access policies).
 *
 * CLIENT-SIDE PRIVACY LAYER (Current):
 * - User-controlled blur preferences
 * - No backend dependency
 * - Immediate protection without waiting for protocol changes
 *
 * PLATFORM MODERATION (Future):
 * - Protocol-level content labeling
 * - Centralized abuse reporting
 * - Administrative policy enforcement
 *
 * ARCHITECTURE:
 * -------------
 * The component uses a pluggable moderation pipeline with clear extension points:
 *
 * 1. Backend Moderation (highest priority - when AT Protocol adds support)
 *    - Passed via `moderation` prop
 *    - Automatically takes precedence
 *    - Integrates with existing Content Filter preferences
 *
 * 2. Custom Policies (extensible via options)
 *    - Bluesky can inject regional rules, A/B tests, etc.
 *    - Sorted by priority
 *    - No component changes needed
 *
 * 3. User Preferences (current implementation)
 *    - Always blur or blur from non-follows
 *    - Fallback when no platform moderation exists
 *
 * INTEGRATION PATH:
 * -----------------
 * When AT Protocol adds moderation support:
 *
 * 1. Protocol adds: MessageView.moderation?: ModerationUI
 * 2. Call moderateMessage(message, moderationOpts) in parent
 * 3. Pass result to this component via `moderation` prop
 * 4. Pipeline automatically prioritizes it
 *
 * The separation between client privacy (user preferences) and platform
 * moderation (backend policies) is intentional - they serve different needs
 * and can coexist.
 */
export function DMImageContentHider({
  message,
  convo,
  moderation,
  children,
  customPolicies,
  onModerationDecision,
}: {
  message: ChatBskyConvoDefs.MessageView
  convo: ChatBskyConvoDefs.ConvoView
  moderation?: ModerationUI // Future: from moderateMessage()
  children: React.ReactNode
  customPolicies?: Array<{
    name: string
    priority: number
    evaluate: (ctx: any) => any
  }> // Extension point for Bluesky
  onModerationDecision?: (decision: any) => void // Analytics/reporting hook
}) {
  const {currentAccount} = useSession()

  const decision = useModerationDecision(
    {
      message,
      convo,
      currentUserDid: currentAccount?.did,
    },
    {
      backendModeration: moderation,
      customPolicies,
      onDecision: onModerationDecision,
    },
  )

  // No blur needed - render directly
  if (!decision.shouldBlur) {
    return <>{children}</>
  }

  // Blur with moderation UI
  return (
    <ContentHider testID="dm-image-content-hider" modui={decision.modui}>
      {children}
    </ContentHider>
  )
}
