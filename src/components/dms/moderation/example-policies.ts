/**
 * Example Custom Moderation Policies
 *
 * This file demonstrates how Bluesky can add new moderation policies
 * without modifying the core DMImageContentHider component.
 *
 * USAGE:
 * ------
 * Import these policies and pass to DMImageContentHider via customPolicies prop:
 *
 * ```tsx
 * <DMImageContentHider
 *   message={message}
 *   convo={convo}
 *   customPolicies={[regionalPolicy, betaTestPolicy]}
 *   onModerationDecision={analyticsCallback}
 * >
 *   {children}
 * </DMImageContentHider>
 * ```
 *
 * ADDING NEW POLICIES:
 * --------------------
 * 1. Define policy with name, priority, and evaluate function
 * 2. Priority determines order (lower = higher priority)
 * 3. Return ModerationDecision or null to pass to next policy
 * 4. Can access full message/convo context
 */

import {type ModerationContext, type ModerationPolicy} from './types'

/**
 * Example: Regional content policy
 * Different regions may have different content standards
 */
export const regionalContentPolicy: ModerationPolicy = {
  name: 'regional-content',
  priority: 5, // Between backend (1-4) and user prefs (10+)
  evaluate: (_context: ModerationContext) => {
    // Example: Check if user is in EU and apply stricter standards
    const userRegion = getUserRegion() // Implement based on your geo system

    if (userRegion === 'EU') {
      // Could check message metadata, sender reputation, etc.
      // For now, just an example structure
      return null // Pass to next policy
    }

    return null
  },
}

/**
 * Example: Beta testing policy
 * Enable new moderation features for subset of users
 */
export const betaTestPolicy: ModerationPolicy = {
  name: 'beta-test',
  priority: 8,
  evaluate: (context: ModerationContext) => {
    const isBetaUser = checkBetaStatus(context.currentUserDid)

    if (isBetaUser) {
      // Beta users get experimental ML-based blur
      // const mlScore = await checkImageSafety(message.embed)
      // if (mlScore < threshold) {
      //   return createBlurDecision('ml-based-blur')
      // }
    }

    return null
  },
}

/**
 * Example: Sender reputation policy
 * Could blur images from senders with poor reputation scores
 */
export const senderReputationPolicy: ModerationPolicy = {
  name: 'sender-reputation',
  priority: 7,
  evaluate: (_context: ModerationContext) => {
    // Example: Check sender's reputation from trust & safety system
    // const reputation = await getSenderReputation(_context.message.sender.did)
    //
    // if (reputation.score < THRESHOLD) {
    //   return {
    //     shouldBlur: true,
    //     source: 'user-preference', // Custom source types could be added
    //     modui: createModerationUI(),
    //     reason: 'low-sender-reputation',
    //   }
    // }

    return null
  },
}

/**
 * Example: Time-based policy
 * Different rules for late-night messages, etc.
 */
export const timeBasedPolicy: ModerationPolicy = {
  name: 'time-based',
  priority: 9,
  evaluate: (context: ModerationContext) => {
    const messageTime = new Date(context.message.sentAt)
    const _hour = messageTime.getHours()

    // Example: Be more cautious with late-night messages
    // if (_hour >= 23 || _hour <= 5) {
    //   Could apply stricter checks
    // }

    return null
  },
}

// Helper functions (implement based on your systems)
function getUserRegion(): string {
  // Implement geolocation check
  return 'US'
}

function checkBetaStatus(_did: string | undefined): boolean {
  // Check if user is in beta program
  return false
}

/**
 * ANALYTICS CALLBACK EXAMPLE:
 * ----------------------------
 * Track moderation decisions for metrics and improvements
 */
export function exampleAnalyticsCallback(decision: any) {
  // Log to analytics system
  console.log('Moderation decision:', {
    source: decision.source,
    reason: decision.reason,
    timestamp: new Date().toISOString(),
  })

  // Could send to Sentry, PostHog, etc.
  // analytics.track('dm_image_moderation', {
  //   source: decision.source,
  //   shouldBlur: decision.shouldBlur,
  //   reason: decision.reason,
  // })
}
