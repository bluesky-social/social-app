/*
 * Quick-react feature constants. Keep this file free of runtime imports.
 */

export const FLAG_NAME = 'quick_reactions_v0'

// Gesture timings (AC-4, AC-6)
export const LONG_PRESS_MS = 400
export const HOVER_REVEAL_MS = 200
export const HOVER_HIDE_MS = 150

// Debounce window (AC-17)
export const DEBOUNCE_MS = 2000

// Storage cap (prevents unbounded growth)
export const MAX_RECORDS = 500
export const PRUNE_COUNT = 100

// Current persisted reactions store version
export const REACTIONS_STORE_VERSION = 1 as const

// Analytics event names
export const EVENT_BAR_OPEN = 'quickReaction:barOpen' as const
export const EVENT_SELECT = 'quickReaction:select' as const
export const EVENT_REMOVE = 'quickReaction:remove' as const
