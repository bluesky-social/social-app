export const DEFAULT_POLL_INTERVAL = 60e3
export const BACKGROUND_POLL_INTERVAL = 60e3 * 5

/** The most logs `chat.bsky.convo.getLog` returns in one call. */
export const LOG_PAGE_SIZE = 100

/**
 * How many full pages of logs one poll fetches before deciding it's too far
 * behind to replay them, and skipping ahead to the present instead.
 */
export const MAX_CATCH_UP_PAGES = 3
