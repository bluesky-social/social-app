import {useCallback} from 'react'
import {I18n} from '@lingui/core'
import {defineMessage, msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {differenceInSeconds} from 'date-fns'

export type DateDiffFormat = 'long' | 'short'

type DateDiff = {
  value: number
  unit: 'now' | 'second' | 'minute' | 'hour' | 'day' | 'month'
  earlier: Date
  later: Date
}

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30

export function useGetTimeAgo({future = false}: {future?: boolean} = {}) {
  const {i18n} = useLingui()
  return useCallback(
    (
      earlier: number | string | Date,
      later: number | string | Date,
      options?: {format: DateDiffFormat},
    ) => {
      const diff = dateDiff(earlier, later, future ? 'up' : 'down')
      return formatDateDiff({diff, i18n, format: options?.format})
    },
    [i18n, future],
  )
}

/**
 * Returns the difference between `earlier` and `later` dates, based on
 * opinionated rules.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - All values round down
 */
export function dateDiff(
  earlier: number | string | Date,
  later: number | string | Date,
  rounding: 'up' | 'down' = 'down',
): DateDiff {
  let diff = {
    value: 0,
    unit: 'now' as DateDiff['unit'],
  }
  const e = new Date(earlier)
  const l = new Date(later)
  const diffSeconds = differenceInSeconds(l, e)

  if (diffSeconds < NOW) {
    diff = {
      value: 0,
      unit: 'now' as DateDiff['unit'],
    }
  } else if (diffSeconds < MINUTE) {
    diff = {
      value: diffSeconds,
      unit: 'second' as DateDiff['unit'],
    }
  } else if (diffSeconds < HOUR) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / MINUTE)
        : Math.floor(diffSeconds / MINUTE)
    diff = {
      value,
      unit: 'minute' as DateDiff['unit'],
    }
  } else if (diffSeconds < DAY) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / HOUR)
        : Math.floor(diffSeconds / HOUR)
    diff = {
      value,
      unit: 'hour' as DateDiff['unit'],
    }
  } else if (diffSeconds < MONTH_30) {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / DAY)
        : Math.floor(diffSeconds / DAY)
    diff = {
      value,
      unit: 'day' as DateDiff['unit'],
    }
  } else {
    const value =
      rounding === 'up'
        ? Math.ceil(diffSeconds / MONTH_30)
        : Math.floor(diffSeconds / MONTH_30)
    diff = {
      value,
      unit: 'month' as DateDiff['unit'],
    }
  }

  return {
    ...diff,
    earlier: e,
    later: l,
  }
}

/**
 * Accepts a `DateDiff` and teturns the difference between `earlier` and
 * `later` dates, formatted as a natural language string.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - Differences >= 360 days are returned as the "M/D/YYYY" string
 * - All values round down
 */
export function formatDateDiff({
  diff,
  format = 'short',
  i18n,
}: {
  diff: DateDiff
  format?: DateDiffFormat
  i18n: I18n
}): string {
  const long = format === 'long'

  switch (diff.unit) {
    case 'now': {
      return i18n._(msg`now`)
    }
    case 'second': {
      return long
        ? i18n._(plural(diff.value, {one: '# second', other: '# seconds'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}s`,
              comment: `How many seconds have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'minute': {
      return long
        ? i18n._(plural(diff.value, {one: '# minute', other: '# minutes'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}m`,
              comment: `How many minutes have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'hour': {
      return long
        ? i18n._(plural(diff.value, {one: '# hour', other: '# hours'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}h`,
              comment: `How many hours have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'day': {
      return long
        ? i18n._(plural(diff.value, {one: '# day', other: '# days'}))
        : i18n._(
            defineMessage({
              message: `${diff.value}d`,
              comment: `How many days have passed, displayed in a narrow form`,
            }),
          )
    }
    case 'month': {
      if (diff.value < 12) {
        return long
          ? i18n._(plural(diff.value, {one: '# month', other: '# months'}))
          : i18n._(
              defineMessage({
                message: `${diff.value}mo`,
                comment: `How many months have passed, displayed in a narrow form`,
              }),
            )
      }
      return i18n.date(new Date(diff.earlier))
    }
  }
}
