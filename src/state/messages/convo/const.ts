/**
 * Interval for when the user is actively using the chat.
 */
export const ACTIVE_POLL_INTERVAL = 1e3

/**
 * Interval for when the user is not actively using the chat, but could still
 * be on the screen.
 */
export const INACTIVE_POLL_INTERVAL = 5e3

/**
 * Interval for when the chat is not visible to the user, or the user has not
 * interacted with the chat in some time.
 */
export const BACKGROUND_POLL_INTERVAL = 20e3

/**
 * Timeout after which we consider the chat to be inactive, and we can slow
 * polling.
 */
export const INACTIVE_TIMEOUT = 60e3

/**
 * Timeout after which we consider the chat stale and in need of a full reset.
 */
export const STALE_TIMEOUT = 60e3 * 5

/**
 * Retryable error statuses
 */
export const NETWORK_FAILURE_STATUSES = [
  1, 408, 425, 429, 500, 502, 503, 504, 522, 524,
]
