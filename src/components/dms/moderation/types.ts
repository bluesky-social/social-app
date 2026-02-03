import {type ChatBskyConvoDefs, type ModerationUI} from '@atproto/api'

/**
 * Moderation decision pipeline for DM images
 *
 * This type system provides extension points for additional moderation sources
 * as the AT Protocol evolves. Each source has a clear priority and can be
 * independently enabled/disabled.
 */

export type ModerationSource = 'backend' | 'user-preference' | 'none'

export interface ModerationDecision {
  shouldBlur: boolean
  source: ModerationSource
  modui?: ModerationUI
  reason?: string
}

/**
 * Context passed to moderation decision functions
 * Extensible - add new fields as AT Protocol adds capabilities
 */
export interface ModerationContext {
  message: ChatBskyConvoDefs.MessageView
  convo: ChatBskyConvoDefs.ConvoView
  currentUserDid: string | undefined

  // Future extensions can add:
  // - reportingCallback?: (decision: ModerationDecision) => void
  // - analyticsCallback?: (decision: ModerationDecision) => void
  // - customPolicies?: ModerationPolicy[]
}

/**
 * Moderation policy interface - allows Bluesky to inject custom policies
 * without modifying component code
 */
export interface ModerationPolicy {
  name: string
  priority: number
  evaluate: (context: ModerationContext) => ModerationDecision | null
}

/**
 * User preference for DM image blurring
 * Separate from platform policies to maintain clear separation of concerns
 */
export interface UserBlurPreferences {
  blurFromNonFollows: boolean
  alwaysBlur: boolean
}
