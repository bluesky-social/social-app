import {ModerationUI} from '@atproto/api'

import {
  useDmImageAlwaysBlur,
  useDmImageBlurFromNonFollows,
} from '#/state/preferences'
import {useSession} from '#/state/session'
import {
  type ModerationContext,
  type ModerationDecision,
  type ModerationPolicy,
  type UserBlurPreferences,
} from './types'

/**
 * Moderation decision hook for DM images
 *
 * This hook implements a pluggable moderation pipeline that provides clear
 * extension points for backend moderation when ready. The architecture follows
 * a clear priority system:
 *
 * 1. BACKEND MODERATION (highest priority - not yet available)
 *    - When AT Protocol adds moderation field to MessageView
 *    - Platform policies based on content labeling
 *    - Automatically takes precedence over everything else
 *
 * 2. CUSTOM POLICIES (extensible - easy to add)
 *    - Can inject via customPolicies parameter
 *    - Sorted by priority
 *    - Enables A/B testing, regional rules, etc.
 *
 * 3. USER PREFERENCES (current implementation)
 *    - Client-side privacy controls
 *    - Always blur or blur from non-follows
 *    - Fallback when no platform moderation exists
 *
 * EXTENSION POINTS:
 * - Add customPolicies array to inject new moderation sources
 * - Pass onDecision callback for analytics/reporting
 * - Backend just needs to populate message.moderation field
 *
 * NO CODE CHANGES needed when backend moderation arrives - it automatically
 * takes priority via the pipeline.
 */
export function useModerationDecision(
  context: ModerationContext,
  options?: {
    backendModeration?: ModerationUI
    customPolicies?: ModerationPolicy[]
    onDecision?: (decision: ModerationDecision) => void
  },
): ModerationDecision {
  const {currentAccount} = useSession()
  const alwaysBlur = useDmImageAlwaysBlur()
  const blurFromNonFollows = useDmImageBlurFromNonFollows()

  const currentUserDid = currentAccount?.did
  const {message} = context

  // STAGE 0: Safety checks - never moderate own messages or invalid data
  if (
    !message.sender ||
    (currentUserDid && message.sender.did === currentUserDid)
  ) {
    const decision: ModerationDecision = {
      shouldBlur: false,
      source: 'none',
      reason: 'own-message',
    }
    options?.onDecision?.(decision)
    return decision
  }

  // STAGE 1: Backend moderation (future - highest priority)
  // When AT Protocol adds: message.moderation or passes via props
  if (options?.backendModeration) {
    const decision: ModerationDecision = {
      shouldBlur: true,
      source: 'backend',
      modui: options.backendModeration,
      reason: 'platform-policy',
    }
    options?.onDecision?.(decision)
    return decision
  }

  // STAGE 2: Custom policies (extensible)
  // Bluesky can inject policies here without modifying this component
  if (options?.customPolicies) {
    const sortedPolicies = [...options.customPolicies].sort(
      (a, b) => a.priority - b.priority,
    )
    for (const policy of sortedPolicies) {
      const policyDecision = policy.evaluate(context)
      if (policyDecision) {
        options?.onDecision?.(policyDecision)
        return policyDecision
      }
    }
  }

  // STAGE 3: User preferences (current implementation)
  const userPrefs: UserBlurPreferences = {
    alwaysBlur: alwaysBlur ?? false,
    blurFromNonFollows: blurFromNonFollows ?? false,
  }

  const decision = evaluateUserPreferences(context, userPrefs, currentUserDid)
  options?.onDecision?.(decision)
  return decision
}

/**
 * Evaluate user preference-based blur decisions
 * Isolated for easier testing and policy updates
 */
function evaluateUserPreferences(
  context: ModerationContext,
  prefs: UserBlurPreferences,
  _currentUserDid: string | undefined,
): ModerationDecision {
  const {message, convo} = context

  // User wants all images blurred
  if (prefs.alwaysBlur) {
    return {
      shouldBlur: true,
      source: 'user-preference',
      modui: createSyntheticModeration(),
      reason: 'user-always-blur',
    }
  }

  // User wants non-follows blurred
  if (prefs.blurFromNonFollows) {
    const sender = convo.members.find(
      member => member.did === message.sender?.did,
    )

    // Blur if: sender not in members (safer default) OR not following
    if (!sender || !sender.viewer?.following) {
      return {
        shouldBlur: true,
        source: 'user-preference',
        modui: createSyntheticModeration(),
        reason: 'user-non-follow',
      }
    }
  }

  // No blur conditions met
  return {
    shouldBlur: false,
    source: 'none',
    reason: 'no-blur-policy',
  }
}

/**
 * Create synthetic ModerationUI for user preferences
 * Uses 'hidden' type which is appropriate for user-driven blur
 */
function createSyntheticModeration(): ModerationUI {
  const modui = new ModerationUI()
  modui.blurs = [
    {
      type: 'hidden',
      source: {type: 'user'},
      priority: 6,
    },
  ]
  return modui
}
