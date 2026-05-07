const SECOND = 1e3
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60

export const STALE = {
  SECONDS: {
    FIFTEEN: 15 * SECOND,
    THIRTY: 30 * SECOND,
  },
  MINUTES: {
    ONE: MINUTE,
    THREE: 3 * MINUTE,
    FIVE: 5 * MINUTE,
    THIRTY: 30 * MINUTE,
  },
  HOURS: {
    ONE: HOUR,
  },
  INFINITY: Infinity,
}

export const GCTIME = {
  INFINITY: Infinity,
}

/**
 * Sentinel prefix used at the start of query keys that should be persisted
 * across sessions. The persist plugin's dehydrate filter looks for this
 * value as the first element of `query.queryKey` to decide whether to keep
 * the query.
 */
export const PERSISTED_QUERY_ROOT = '__persisted__'

/**
 * Long gcTime applied to persisted queries so they survive cache eviction.
 */
export const PERSISTED_QUERY_GCTIME = 24 * 60 * 60 * 1000
