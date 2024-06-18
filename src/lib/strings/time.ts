import {plural} from '@lingui/macro'
import {differenceInSeconds} from 'date-fns'

export function ago(date: number | string | Date): string {
  return dateDiff(date, Date.now())
}

const NOW = 5
const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH_30 = DAY * 30

/**
 * Returns the difference between date1 and date2 in full seconds, minutes,
 * hours etc. All month are considered exactly 30 days. Assuming that date1 <=
 * date2. Differences >= 360 days are returned as the "M/D/YYYY" string
 */
export function dateDiff(
  earlier: number | string | Date,
  later: number | string | Date,
  options?: {
    format?: 'long' | 'short'
  },
): string {
  const format = options?.format || 'short'
  const long = format === 'long'
  const diffSeconds = differenceInSeconds(new Date(later), new Date(earlier))

  if (diffSeconds < NOW) {
    return `now`
  } else if (diffSeconds < MINUTE) {
    return `${diffSeconds}${
      long ? ` ${plural(diffSeconds, {one: 'second', other: 'seconds'})}` : 's'
    }`
  } else if (diffSeconds < HOUR) {
    const diff = Math.floor(diffSeconds / MINUTE)
    return `${diff}${
      long ? ` ${plural(diff, {one: 'minute', other: 'minutes'})}` : 'm'
    }`
  } else if (diffSeconds < DAY) {
    const diff = Math.floor(diffSeconds / HOUR)
    return `${diff}${
      long ? ` ${plural(diff, {one: 'hour', other: 'hours'})}` : 'h'
    }`
  } else if (diffSeconds < MONTH_30) {
    const diff = Math.floor(diffSeconds / DAY)
    return `${diff}${
      long ? ` ${plural(diff, {one: 'day', other: 'days'})}` : 'd'
    }`
  } else {
    const diffMonths30 = Math.floor(diffSeconds / MONTH_30)
    if (diffMonths30 < 12) {
      return `${diffMonths30}${long ? ' months' : 'mo'}`
    } else {
      const str = new Date(earlier).toLocaleDateString()

      if (long) {
        return `on ${str}`
      }
      return str
    }
  }
}

export function niceDate(date: number | string | Date) {
  const d = new Date(date)
  return `${d.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} at ${d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export function getAge(birthDate: Date): number {
  var today = new Date()
  var age = today.getFullYear() - birthDate.getFullYear()
  var m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
