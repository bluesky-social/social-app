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
