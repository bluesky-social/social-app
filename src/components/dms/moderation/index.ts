/**
 * DM Image Moderation System
 *
 * This module provides a pluggable architecture for moderating images in Direct Messages.
 * It's designed to handle both client-side privacy preferences and future platform-level
 * moderation without requiring architectural changes.
 *
 * CURRENT USE:
 * - User privacy preferences (blur from non-follows, always blur)
 *
 * FUTURE EXTENSIBILITY:
 * - Backend moderation via AT Protocol
 * - Custom regional policies
 * - A/B testing different moderation approaches
 * - Analytics and reporting hooks
 */

export * from './types'
export {useModerationDecision} from './useModerationDecision'
