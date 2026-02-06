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

/**
 * Root key for persisted queries.
 *
 * If the `querykey` of your query uses this at index 0, it will be
 * persisted automatically by the `PersistQueryClientProvider` in
 * `#/lib/react-query.tsx`.
 *
 * Be careful when using this, since it will change the query key and may
 * break any cases where we call `invalidateQueries` or `refetchQueries`
 * with the old key.
 *
 * Also, only use this for queries that are safe to persist between
 * app launches (like user preferences).
 *
 * Note that for queries that are persisted, it is recommended to extend
 * the `gcTime` to a longer duration, otherwise it'll get busted
 */
export const PERSISTED_QUERY_ROOT = 'PERSISTED'
export const PERSISTED_QUERY_GCTIME = Infinity
